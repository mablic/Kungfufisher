import {useEffect, useRef, useState} from 'react';
import {Alert, AppState, Linking, Platform} from 'react-native';
import {requireOptionalNativeModule} from 'expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ANDROID_STORE_URL, IOS_STORE_URL, appStoreUpdate, checkDue} from './storeUpdatePolicy';

type Check = {available:boolean; downloaded?:boolean; flexible?:boolean; latestBuild?:string; build?:string};
type Native = {
  infoAsync(): Promise<{version:string;build:string;country:string;sandbox:boolean;systemVersion:string}>;
  checkAsync(): Promise<Check>;
  startAsync(): Promise<string>;
  completeAsync(): Promise<boolean>;
  addListener(event:'onDownloaded',listener:()=>void): {remove():void};
};
type Update = {kind:'store'|'downloaded';version:string;flexible:boolean};
const native=requireOptionalNativeModule<Native>('KungFuStoreUpdate');
const CHECK_KEY=`kungfu-fisher/store-check/${Platform.OS}`;
const REMINDER_KEY='kungfu-fisher/play-downloaded-reminder';
const DOWNLOAD_KEY='kungfu-fisher/play-download';
const enabled=!__DEV__ && !!native && (Platform.OS==='ios'||Platform.OS==='android');

function bounded<T>(promise:Promise<T>,ms=6500):Promise<T> {
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error('Update check timed out')),ms);
    promise.then(value=>{clearTimeout(timer);resolve(value);},error=>{clearTimeout(timer);reject(error);});
  });
}
/** Never waits on the game loop, and never presents over gameplay or another modal. */
export function useStoreUpdates(idle:boolean,onBusyChange:(busy:boolean)=>void) {
  const [pending,setPending]=useState<Update|null>(null), [wake,setWake]=useState(0);
  const eligible=useRef(idle), inFlight=useRef(false), dialogOpen=useRef(false), alive=useRef(true);
  const memoryCheck=useRef(0);
  eligible.current=idle;
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
  useEffect(()=>{
    if(!enabled) return;
    const sub=AppState.addEventListener('change',state=>{if(state==='active')setWake(n=>n+1);});
    const download=Platform.OS==='android' ? native!.addListener('onDownloaded',()=>{
      void AsyncStorage.getItem(REMINDER_KEY).then(last=>{
        if(alive.current && checkDue(Number(last),Date.now()))setPending({kind:'downloaded',version:'',flexible:true});
      }).catch(()=>{});
    }) : null;
    return()=>{sub.remove();download?.remove();};
  },[]);
  useEffect(()=>{
    if(!enabled || !idle) return;
    let cancelled=false;
    const timer=setTimeout(()=>{
      void (async()=>{
        if(cancelled || inFlight.current || AppState.currentState!=='active')return;
        inFlight.current=true;
        try {
          const downloading=Platform.OS==='android' && await AsyncStorage.getItem(DOWNLOAD_KEY)==='1';
          const stored=Number(await AsyncStorage.getItem(CHECK_KEY));
          const now=Date.now();
          if(!downloading && !checkDue(Math.max(stored||0,memoryCheck.current),now))return;
          // An attempt is throttled too, so an offline device cannot retry on every navigation.
          memoryCheck.current=now;
          await AsyncStorage.setItem(CHECK_KEY,String(now));
          let update:Update|null=null;
          if(Platform.OS==='ios') {
            const info=await bounded(native!.infoAsync());
            if(info.sandbox) return; // TestFlight should not be compared with the public store.
            const country=/^[A-Za-z]{2}$/.test(info.country) ? info.country : 'US';
            const controller=new AbortController();
            const timeout=setTimeout(()=>controller.abort(),6000);
            try {
              const response=await fetch(`https://itunes.apple.com/lookup?id=6825627684&country=${country}`,{signal:controller.signal});
              if(!response.ok) return;
              const version=appStoreUpdate(await response.json(),info.version,info.systemVersion);
              if(version)update={kind:'store',version,flexible:false};
            } finally {clearTimeout(timeout);}
          } else {
            const info=await bounded(native!.checkAsync());
            if(info.downloaded) {
              const last=Number(await AsyncStorage.getItem(REMINDER_KEY));
              if(checkDue(last,Date.now()))update={kind:'downloaded',version:'',flexible:true};
            }
            else if(info.available)update={kind:'store',version:info.latestBuild??'',flexible:!!info.flexible};
            else if(downloading)await AsyncStorage.removeItem(DOWNLOAD_KEY);
          }
          if(alive.current && update)setPending(update);
        } catch { /* Store/offline failures must never interrupt a run. */ }
        finally {inFlight.current=false;}
      })();
    },1800);
    return()=>{cancelled=true;clearTimeout(timer);};
  },[idle,wake]);
  useEffect(()=>{
    if(!enabled || !idle || !pending || dialogOpen.current || AppState.currentState!=='active')return;
    dialogOpen.current=true; onBusyChange(true);
    const release=()=>{dialogOpen.current=false;onBusyChange(false);setWake(n=>n+1);};
    const later=()=>{setPending(null);release();};
    const update=pending;
    if(update.kind==='downloaded')void AsyncStorage.setItem(REMINDER_KEY,String(Date.now())).catch(()=>{});
    Alert.alert(update.kind==='downloaded'?'Your update is ready':'A new adventure awaits',
      update.kind==='downloaded'?'Restart Kung Fu Fisher to finish installing the update. Your saved progress is safe.':
        `Update Kung Fu Fisher${Platform.OS==='ios' ? ` to ${update.version}` : ''} for smoother gameplay, new challenges, and improvements.`,[
        {text:'Later',style:'cancel',onPress:later},
        {text:update.kind==='downloaded'?'Restart now':'Update now',onPress:()=>{
          setPending(null);
          void (async()=>{
            try {
              if(!eligible.current || AppState.currentState!=='active')return;
              if(update.kind==='downloaded') await bounded(native!.completeAsync());
              else if(Platform.OS==='android' && update.flexible) {
                const result=await native!.startAsync();
                if(result==='accepted') await AsyncStorage.setItem(DOWNLOAD_KEY,'1');
                else if(result==='unavailable')await Linking.openURL(ANDROID_STORE_URL);
              } else await Linking.openURL(Platform.OS==='ios'?IOS_STORE_URL:ANDROID_STORE_URL);
            } catch {
              // Google Play flow failure can still be recovered through the store page.
              if(eligible.current && AppState.currentState==='active')
                await Linking.openURL(Platform.OS==='ios'?IOS_STORE_URL:ANDROID_STORE_URL).catch(()=>{});
            } finally {if(alive.current)release();}
          })();
        }},
      ],{cancelable:false});
  },[idle,pending,onBusyChange,wake]);
}

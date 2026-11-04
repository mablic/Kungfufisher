import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {AppState, Platform} from 'react-native';
import {requireOptionalNativeModule} from 'expo';
import Constants from 'expo-constants';
import type {LevelRecord} from './save';
import {achievementProgress} from './achievements';
import {AchievementSync} from './achievementSync';

type Player = {authenticated: boolean; playerID: string; alias: string; presenting?: boolean};
type Bridge = {
  authenticateAsync(): Promise<Player>;
  reportAsync(playerID: string, values: Record<string, number>): Promise<boolean>;
  showAchievementsAsync(): Promise<boolean>;
  addListener(name: 'onAuthChange', listener: (player: Player) => void): {remove(): void};
};
const native = Platform.OS === 'ios' && Constants.expoConfig?.extra?.gameCenterEnabled === true ? requireOptionalNativeModule<Bridge>('KungFuGameCenter') : null;
const sync = native ? new AchievementSync((playerID, values) => native.reportAsync(playerID, values)) : null;
export function useGameCenter(records: Record<number, LevelRecord>, loaded: boolean, idle: boolean, pause: () => void) {
  const [player, setPlayer] = useState<Player>({authenticated:false, playerID:'', alias:''});
  const [busy, setBusy] = useState(!!native), [error, setError] = useState<string|null>(null);
  const [retry, setRetry] = useState(0);
  const attempted = useRef(false), inFlight = useRef(false), pauseRef = useRef(pause);
  pauseRef.current = pause;
  const progress = useMemo(() => achievementProgress(records), [records]);
  const connect = useCallback(async () => {
    if(!native || inFlight.current) return;
    inFlight.current = true; setBusy(true); setError(null);
    try { setPlayer(await native.authenticateAsync()); }
    catch { setError('Game Center could not connect. Your progress is saved on this device.'); }
    finally { inFlight.current = false; setBusy(false); setRetry(v=>v+1); }
  }, []);
  useEffect(() => {
    if(!native) return;
    const listener = native.addListener('onAuthChange', next => {
      if(next.presenting) { pauseRef.current(); return; }
      setPlayer(next); setRetry(v=>v+1);
    });
    return () => listener.remove();
  }, []);
  useEffect(() => {
    if(!native || !loaded || !idle || attempted.current) return;
    attempted.current = true;
    void connect();
  }, [loaded, idle, connect]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if(state === 'active') setRetry(v=>v+1);
    });
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    if(!sync || !loaded || !idle || !player.authenticated) return;
    let active = true;
    void sync.sync(player.playerID, Object.fromEntries(progress.map(a=>[a.id,a.percent])))
      .then(()=> {if(active) setError(null);})
      .catch(()=> {if(active) setError('Achievements saved here. Game Center sync will retry when you return.');});
    return () => {active=false;};
  }, [loaded, idle, player, progress, retry]);
  const show = useCallback(async () => {
    if(!native) return;
    if(!player.authenticated) { await connect(); return; }
    setBusy(true); setError(null); pauseRef.current();
    try { await native.showAchievementsAsync(); }
    catch { setError('Game Center is unavailable. Please try again from the home screen.'); }
    finally { setBusy(false); setRetry(v=>v+1); }
  }, [player.authenticated, connect]);
  return {available:!!native, player, busy, error, progress, show};
}

import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Animated, Image, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions} from 'react-native';
import {StatusBar} from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

export const SPLASH_COLOR = '#0B2423';
let nativeHidden = false;
// Hand native launch over to a real, already-laid-out React screen, not a timer.
export function hideNativeLaunch() {
  if(nativeHidden) return;
  nativeHidden = true;
  void SplashScreen.hideAsync().catch(()=>{});
}
export function LaunchScreen({error, onRetry}: {error?: string|null; onRetry?:()=>void}) {
  const compact = useWindowDimensions().height < 700;
  return <View style={s.screen} onLayout={hideNativeLaunch} accessibilityLabel="Kung Fu Fisher is loading">
    <StatusBar style="light" />
    <View pointerEvents="none" style={s.frame} />
    <Text style={s.eyebrow}>A JOURNEY THROUGH JIANGHU</Text>
    <Image source={require('../../assets/branding/splash-mark-v1.png')} style={s.emblem} resizeMode="contain" />
    <View style={[s.brand, compact && {marginTop:90}]} >
      <Text style={[s.title, compact && {fontSize:28,lineHeight:32}]}>KUNG FU</Text><Text style={[s.title, compact && {fontSize:28,lineHeight:32}]}>FISHER</Text>
      <View style={s.rule}><View style={s.line}/><View style={s.diamond}/><View style={s.line}/></View>
      <Text style={s.tagline}>ONE BLADE. A THOUSAND RIPPLES.</Text>
    </View>
    <View style={[s.status, compact && {bottom:28}]} accessibilityLiveRegion="polite">
      {error ? <Text style={s.error}>The river could not load. Please try again.</Text> : <>
        <ActivityIndicator size="small" color="#DCC38B" />
        <Text style={s.loading}>Entering the river…</Text>
      </>}
      {!!error && onRetry && <Pressable accessibilityRole="button" onPress={onRetry} style={s.retry}><Text style={s.retryText}>Try again</Text></Pressable>}
    </View>
  </View>;
}
export function LaunchOverlay({visible, error, onRetry}: {visible:boolean; error:string|null; onRetry:()=>void}) {
  const [mounted,setMounted]=useState(visible), opacity=useRef(new Animated.Value(visible?1:0)).current;
  useEffect(()=>{
    if(visible) {setMounted(true);opacity.setValue(1);return;}
    const fade=Animated.timing(opacity,{toValue:0,duration:180,useNativeDriver:true});
    fade.start(({finished})=>{if(finished)setMounted(false);});
    return ()=>fade.stop();
  },[visible,opacity]);
  if(!mounted&&!visible)return null;
  return <Animated.View pointerEvents={visible?'auto':'none'} style={[StyleSheet.absoluteFill,{opacity}]}>
    <LaunchScreen error={error} onRetry={onRetry}/>
  </Animated.View>;
}
const s=StyleSheet.create({
  screen:{flex:1,backgroundColor:SPLASH_COLOR},
  frame:{position:'absolute',top:28,bottom:28,left:20,right:20,borderWidth:StyleSheet.hairlineWidth,borderColor:'#AB915335'},
  eyebrow:{position:'absolute',top:'50%',marginTop:-152,alignSelf:'center',fontSize:9,letterSpacing:3,color:'#B9B898'},
  emblem:{position:'absolute',top:'50%',left:'50%',width:200,height:200,marginLeft:-100,marginTop:-100},
  brand:{position:'absolute',top:'50%',marginTop:112,left:20,right:20,alignItems:'center'},
  title:{fontFamily:Platform.OS==='ios'?'Georgia':'serif',fontSize:36,lineHeight:40,letterSpacing:5,color:'#F1DEB0',textAlign:'center'},
  rule:{flexDirection:'row',alignItems:'center',gap:12,marginVertical:18},line:{width:38,height:1,backgroundColor:'#BA9B5F'},diamond:{height:4,width:4,backgroundColor:'#BA9B5F',transform:[{rotate:'45deg'}]},
  tagline:{fontSize:7,letterSpacing:1.9,color:'#B9B898',textAlign:'center'},
  status:{position:'absolute',bottom:52,left:32,right:32,alignItems:'center',gap:12},loading:{color:'#9FAF9E',fontSize:11,letterSpacing:1},
  error:{color:'#E4C9AD',fontSize:13,textAlign:'center'},retry:{borderWidth:1,borderColor:'#BA9B5F',paddingHorizontal:24,paddingVertical:12,borderRadius:8},retryText:{color:'#F1DEB0',fontWeight:'600'},
});

import React from 'react';
import {Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {achievementProgress} from '../achievements';

type Props = {
  visible: boolean; progress: ReturnType<typeof achievementProgress>;
  available: boolean; connected: boolean; alias: string; busy: boolean; error: string|null;
  onClose(): void; onGameCenter(): void; onDismiss(): void;
};
export function Achievements(props: Props) {
  const completed=props.progress.filter(a=>a.percent>=100).length;
  return <Modal visible={props.visible} animationType="slide" onRequestClose={props.onClose} onDismiss={props.onDismiss}>
    <SafeAreaView style={s.page}>
      <View style={s.header}><Text style={s.heading}>River achievements</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Close achievements" onPress={props.onClose} style={s.close}><Text style={s.link}>Done</Text></Pressable>
      </View>
      <Text style={s.body}>{completed}/{props.progress.length} earned · Your next river has something to master.</Text>
      {Platform.OS==='ios' && <View style={s.status}>
        <Text style={s.body}>{props.connected ? `Game Center · ${props.alias}` : props.available ? 'Your progress is saved here. Connect to sync with Game Center.' : 'Local achievements · Progress is saved on this device.'}</Text>
        {props.available && <Pressable accessibilityRole="button" disabled={props.busy} onPress={props.onGameCenter} style={s.action}>
          <Text style={s.actionText}>{props.busy?'Connecting…':props.connected?'Open Game Center':'Connect Game Center'}</Text>
        </Pressable>}
        {!!props.error && <Text accessibilityLiveRegion="polite" style={s.error}>{props.error}</Text>}
      </View>}
      <ScrollView contentContainerStyle={s.list}>
        {props.progress.map(a=><View key={a.id} style={[s.card,a.percent===100&&s.earned]}>
          <View style={s.row}><Text style={s.title}>{a.percent===100?'✦ ':''}{a.title}</Text><Text style={s.count}>{a.value}/{a.target}</Text></View>
          <Text style={s.body}>{a.detail}</Text>
          <View accessible accessibilityLabel={`${a.title}: ${a.percent} percent`} style={s.track}><View style={[s.fill,{width:`${a.percent}%`}]} /></View>
          <Text style={s.caption}>{a.percent===100?'Earned':`${a.percent}% complete`} · {a.points} {props.available ? 'Game Center points' : 'points'}</Text>
        </View>)}
      </ScrollView>
    </SafeAreaView>
  </Modal>;
}
const s=StyleSheet.create({
  page:{flex:1,backgroundColor:'#F4EEDC'},header:{paddingHorizontal:20,paddingTop:12,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  heading:{fontSize:24,fontWeight:'700',color:'#203D36',flex:1},close:{padding:12},link:{color:'#235D50',fontSize:17},body:{fontSize:14,lineHeight:21,color:'#52665B',marginHorizontal:20,marginVertical:8},
  list:{padding:16,gap:12,paddingBottom:32},card:{paddingVertical:14,backgroundColor:'#FFFCF2',borderRadius:16,borderWidth:1,borderColor:'#DED7BE'},earned:{borderColor:'#B69A4A'},
  row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:20,gap:8},title:{fontSize:17,fontWeight:'600',color:'#203D36',flex:1},count:{fontSize:13,color:'#52665B'},
  track:{height:5,backgroundColor:'#E1E3D0',marginHorizontal:20,borderRadius:3,overflow:'hidden',marginVertical:8},fill:{height:5,backgroundColor:'#4D8566'},caption:{fontSize:12,color:'#7C775C',marginHorizontal:20},
  status:{paddingBottom:10},action:{marginHorizontal:20,padding:12,borderRadius:10,backgroundColor:'#254C40'},actionText:{textAlign:'center',color:'#FFF4D8',fontSize:15,fontWeight:'600'},error:{marginHorizontal:20,fontSize:13,color:'#914C32',lineHeight:19},
});

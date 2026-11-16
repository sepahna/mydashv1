import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Keyboard, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';

type Note = { id: string; text: string; createdAt: number };
const STORAGE_KEY = '@mydash/notes';
const fa = (value: number) => new Intl.NumberFormat('fa-IR').format(value);

function getDateInfo(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-u-ca-persian-nu-latn', {
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(date);
  const part = (type: string) => parts.find(p => p.type === type)?.value ?? '';
  const year = part('year');
  const month = part('month');
  const day = part('day');
  const monthName = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { month: 'long' }).format(date);
  const gregorian = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(date);
  const weekday = new Intl.DateTimeFormat('fa-IR', { weekday: 'long' }).format(date);
  return { persianNumeric: `${year}/${month}/${day}`, persianNamed: `${year}/${monthName}/${day}`, gregorian, weekday };
}

function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export default function App() {
  const [now, setNow] = useState(new Date());
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => { if (raw) setNotes(JSON.parse(raw)); })
      .catch(() => Alert.alert('خطا', 'یادداشت‌های ذخیره‌شده خوانده نشدند.'))
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes)).catch(() =>
      Alert.alert('خطا', 'ذخیره یادداشت انجام نشد.')
    );
  }, [notes, loaded]);

  const date = useMemo(() => getDateInfo(now), [now]);
  const time = useMemo(() => new Intl.DateTimeFormat('fa-IR', {
    hour: '2-digit', minute: '2-digit'
  }).format(now), [now]);

  const addNote = () => {
    const text = draft.trim();
    if (!text) return;
    setNotes(current => [{ id: `${Date.now()}-${Math.random()}`, text, createdAt: Date.now() }, ...current]);
    setDraft('');
    Keyboard.dismiss();
  };

  const removeNote = (id: string) => Alert.alert('حذف یادداشت', 'این یادداشت حذف شود؟', [
    { text: 'انصراف', style: 'cancel' },
    { text: 'حذف', style: 'destructive', onPress: () => setNotes(current => current.filter(n => n.id !== id)) }
  ]);

  return (
    <SafeAreaView style={styles.safe}>
      <ExpoStatusBar style="light" />
      <StatusBar barStyle="light-content" backgroundColor="#0B1020" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>PERSONAL SPACE</Text>
            <Text style={styles.heading}>داشبورد من</Text>
            <Text style={styles.subtitle}>همه چیز، ساده و در دسترس</Text>
          </View>
          <View style={styles.avatar}><Feather name="grid" size={21} color="#B9A7FF" /></View>
        </View>

        <Card style={styles.dateCard}>
          <View style={styles.dateTop}>
            <View style={styles.liveDot} />
            <Text style={styles.dateLabel}>امروز · {date.weekday}</Text>
            <View style={{ flex: 1 }} />
            <Feather name="calendar" size={18} color="#A99AF4" />
          </View>
          <Text style={styles.persianDate}>{date.persianNumeric}</Text>
          <Text style={styles.namedDate}>{date.persianNamed}</Text>
          <View style={styles.dateDivider} />
          <View style={styles.dateBottom}>
            <View>
              <Text style={styles.smallLabel}>تاریخ میلادی</Text>
              <Text style={styles.gregorian}>{date.gregorian}</Text>
            </View>
            <View style={styles.timeWrap}>
              <Feather name="clock" size={15} color="#A99AF4" />
              <Text style={styles.time}>{time}</Text>
            </View>
          </View>
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>یادداشت سریع</Text>
          <Text style={styles.sectionHint}>آفلاین و خصوصی</Text>
        </View>
        <Card style={styles.composer}>
          <TextInput value={draft} onChangeText={setDraft}
            placeholder="چی توی ذهنت هست؟ همین‌جا بنویس..."
            placeholderTextColor="#777F98" multiline textAlignVertical="top"
            style={styles.input} returnKeyType="default" />
          <View style={styles.composerFooter}>
            <Text style={styles.inputHint}>یادداشت فقط روی همین دستگاه ذخیره می‌شود</Text>
            <TouchableOpacity onPress={addNote} activeOpacity={0.8} style={styles.addButton}>
              <Feather name="plus" size={17} color="#111326" />
              <Text style={styles.addButtonText}>ثبت یادداشت</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>یادداشت‌های من</Text>
          <View style={styles.countPill}><Text style={styles.countText}>{fa(notes.length)}</Text></View>
        </View>
        {notes.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyIcon}><Feather name="edit-3" size={22} color="#A99AF4" /></View>
            <Text style={styles.emptyTitle}>هنوز یادداشتی نداری</Text>
            <Text style={styles.emptyText}>اولین یادداشتت رو از کادر بالا اضافه کن.</Text>
          </Card>
        ) : notes.map(note => (
          <Card key={note.id} style={styles.noteCard}>
            <View style={styles.noteHeader}>
              <Text style={styles.noteTime}>{new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' }).format(new Date(note.createdAt))}</Text>
              <TouchableOpacity onPress={() => removeNote(note.id)} hitSlop={10}>
                <Feather name="trash-2" size={16} color="#8991A8" />
              </TouchableOpacity>
            </View>
            <Text style={styles.noteText}>{note.text}</Text>
          </Card>
        ))}
        <View style={styles.footer}>
          <Feather name="shield-check" size={14} color="#68718B" />
          <Text style={styles.footerText}>بدون نیاز به اینترنت · اطلاعات روی دستگاه شما</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0B1020' },
  container: { paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 24 : 14, paddingBottom: 36 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 25 },
  eyebrow: { color: '#8D80C9', fontSize: 10, letterSpacing: 2, textAlign: 'right', fontWeight: '700' },
  heading: { color: '#F5F4FF', fontSize: 27, fontWeight: '800', textAlign: 'right', marginTop: 5 },
  subtitle: { color: '#858DA6', fontSize: 12, textAlign: 'right', marginTop: 4 },
  avatar: { width: 48, height: 48, borderRadius: 17, backgroundColor: '#211D3D', borderWidth: 1, borderColor: '#39315F', alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#141B2E', borderRadius: 22, borderWidth: 1, borderColor: '#252D45', padding: 18, marginBottom: 13 },
  dateCard: { backgroundColor: '#211D3D', borderColor: '#39315F', padding: 21, marginBottom: 27, overflow: 'hidden' },
  dateTop: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#A99AF4' },
  dateLabel: { color: '#C4BCEB', fontSize: 12, textAlign: 'right' },
  persianDate: { color: '#FFFFFF', fontSize: 35, fontWeight: '800', textAlign: 'right', marginTop: 20, letterSpacing: 1 },
  namedDate: { color: '#B9A7FF', fontSize: 16, textAlign: 'right', marginTop: 5 },
  dateDivider: { height: 1, backgroundColor: '#3B355C', marginVertical: 19 },
  dateBottom: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  smallLabel: { color: '#938BB8', fontSize: 10, textAlign: 'right', marginBottom: 5 },
  gregorian: { color: '#E4E0F8', fontSize: 15, fontWeight: '600' },
  timeWrap: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#30294F', borderRadius: 12, paddingHorizontal: 11, paddingVertical: 8 },
  time: { color: '#E4DEFF', fontSize: 14, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 9, marginBottom: 12, marginTop: 2 },
  sectionTitle: { color: '#F1F0FA', fontSize: 16, fontWeight: '700', textAlign: 'right' },
  sectionHint: { color: '#8D80C9', fontSize: 11, marginRight: 'auto' },
  composer: { padding: 14, marginBottom: 25 },
  input: { minHeight: 86, color: '#F4F3FC', fontSize: 14, lineHeight: 23, textAlign: 'right', padding: 5 },
  composerFooter: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#293149', paddingTop: 12, marginTop: 8 },
  inputHint: { color: '#747E99', fontSize: 9, flex: 1, textAlign: 'right', marginLeft: 8 },
  addButton: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5, backgroundColor: '#B9A7FF', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  addButtonText: { color: '#17142A', fontSize: 11, fontWeight: '800' },
  countPill: { backgroundColor: '#272342', borderRadius: 9, paddingHorizontal: 9, paddingVertical: 3 },
  countText: { color: '#B9A7FF', fontSize: 11, fontWeight: '700' },
  emptyCard: { alignItems: 'center', paddingVertical: 26 },
  emptyIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#272342', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { color: '#EDEBFA', fontSize: 14, fontWeight: '700' },
  emptyText: { color: '#858DA6', fontSize: 11, marginTop: 6 },
  noteCard: { paddingVertical: 14 },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 },
  noteTime: { color: '#818AA4', fontSize: 10 },
  noteText: { color: '#E9E8F2', fontSize: 14, lineHeight: 23, textAlign: 'right' },
  footer: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 16 },
  footerText: { color: '#68718B', fontSize: 10 }
});
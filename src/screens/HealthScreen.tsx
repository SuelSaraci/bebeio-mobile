import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { format } from 'date-fns';
import {
  AlertCircle,
  Shield,
  Calendar,
  MessageCircle,
  Plus,
  Check,
  Trash2,
} from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { useFeatureGate } from '../hooks/useFeatureGate';
import {
  Modal,
  FL,
  TI,
  PBtn,
  EmptyState,
  ConfirmDeleteModal,
  DatePickerField,
  TimePickerField,
} from '../components/ui';
import { colors } from '../theme/colors';
import { safeDate } from '../utils';

export function HealthScreen() {
  const {
    vaccinations,
    appointments,
    medNotes,
    updateVaccination,
    addVaccination,
    deleteVaccination,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    addMedNote,
    updateMedNote,
    deleteMedNote,
    mutating,
    userVaccinationCount,
  } = useApp();
  const { gateAdd, handleAddSaveResult } = useFeatureGate();
  const [showVax, setShowVax] = useState(false);
  const [showApt, setShowApt] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [confirmVax, setConfirmVax] = useState<string | null>(null);
  const [confirmApt, setConfirmApt] = useState<string | null>(null);
  const [confirmNote, setConfirmNote] = useState<string | null>(null);

  const [vaxName, setVaxName] = useState('');
  const [vaxDate, setVaxDate] = useState(new Date());
  const [aptDoctor, setAptDoctor] = useState('');
  const [aptSpec, setAptSpec] = useState('Pediatrician');
  const [aptDate, setAptDate] = useState(new Date());
  const [aptTime, setAptTime] = useState(() => {
    const d = new Date();
    d.setHours(10, 0, 0, 0);
    return d;
  });
  const [aptType, setAptType] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteDate, setNoteDate] = useState(new Date());
  const [noteContent, setNoteContent] = useState('');

  const nextVax = vaccinations.find((v) => !v.done);

  const toggleVax = (id: string, done: boolean) => {
    if (mutating) return;
    if (done) {
      updateVaccination(id, { done: false, completedDate: undefined });
    } else {
      updateVaccination(id, { done: true, completedDate: format(new Date(), 'yyyy-MM-dd') });
    }
  };

  const toggleApt = (id: string, done: boolean) => {
    if (mutating) return;
    if (done) {
      updateAppointment(id, { done: false, completedDate: undefined });
    } else {
      updateAppointment(id, { done: true, completedDate: format(new Date(), 'yyyy-MM-dd') });
    }
  };

  const toggleNote = (id: string, done: boolean) => {
    if (mutating) return;
    if (done) {
      updateMedNote(id, { done: false, completedDate: undefined });
    } else {
      updateMedNote(id, { done: true, completedDate: format(new Date(), 'yyyy-MM-dd') });
    }
  };

  const saveVax = async () => {
    if (mutating || !vaxName.trim()) return;
    const ok = await addVaccination({
      name: vaxName.trim(),
      scheduledDate: format(vaxDate, 'yyyy-MM-dd'),
      done: false,
    });
    handleAddSaveResult(ok, 'vaccination', () => setShowVax(false), () => {
      setVaxName('');
      setVaxDate(new Date());
      setShowVax(false);
    });
  };

  const saveApt = async () => {
    if (mutating || !aptDoctor.trim() || !aptType.trim()) return;
    const ok = await addAppointment({
      doctor: aptDoctor.trim(),
      specialty: aptSpec,
      date: format(aptDate, 'yyyy-MM-dd'),
      time: format(aptTime, 'HH:mm'),
      type: aptType.trim(),
      done: false,
    });
    handleAddSaveResult(ok, 'appointment', () => setShowApt(false), () => {
      setAptDoctor('');
      setAptType('');
      setShowApt(false);
    });
  };

  const saveNote = async () => {
    if (mutating || !noteTitle.trim() || !noteContent.trim()) return;
    const ok = await addMedNote({
      date: format(noteDate, 'yyyy-MM-dd'),
      title: noteTitle.trim(),
      content: noteContent.trim(),
      done: false,
    });
    handleAddSaveResult(ok, 'med_note', () => setShowNote(false), () => {
      setNoteTitle('');
      setNoteContent('');
      setNoteDate(new Date());
      setShowNote(false);
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View>
        <Text style={styles.title}>Health</Text>
        <Text style={styles.sub}>Vaccinations, appointments & notes</Text>
      </View>

      {nextVax && (
        <View style={styles.alert}>
          <AlertCircle size={16} color={colors.rose500} />
          <View style={styles.alertBody}>
            <Text style={styles.alertTitle}>Upcoming Vaccination</Text>
            <Text style={styles.alertName}>{nextVax.name}</Text>
            <Text style={styles.alertSub}>Scheduled: {safeDate(nextVax.scheduledDate)}</Text>
          </View>
          <TouchableOpacity style={styles.markDone} disabled={mutating} onPress={() => toggleVax(nextVax.id, false)}>
            <Text style={styles.markDoneText}>Mark Done</Text>
          </TouchableOpacity>
        </View>
      )}

      <SectionHeader title="Vaccinations" disabled={mutating} onAdd={() => gateAdd(userVaccinationCount, 'vaccination', () => { setVaxName(''); setVaxDate(new Date()); setShowVax(true); })} />
      <Text style={styles.scheduleHint}>
        Essential vaccines based on your baby&apos;s birth date. Mark each when given, or tap Add for boosters and others.
      </Text>
      {vaccinations.length === 0 ? (
        <EmptyState icon={<Shield size={22} color={colors.mutedForeground} />} title="No vaccinations" desc="Add your baby's vaccination schedule." />
      ) : (
        <View style={styles.list}>
          {[...vaccinations]
            .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
            .map((v, i) => (
            <TouchableOpacity
              key={v.id}
              style={[styles.vaxItem, i > 0 && styles.listBorder]}
              onPress={() => toggleVax(v.id, v.done)}
              disabled={mutating}
              activeOpacity={0.7}
            >
              <View style={[styles.vaxCheck, v.done ? styles.vaxDone : styles.vaxPending]}>
                {v.done ? <Check size={14} color={colors.green600} /> : <Shield size={13} color={colors.rose500} />}
              </View>
              <View style={styles.vaxBody}>
                <Text style={styles.vaxName}>{v.name}</Text>
                <Text style={styles.vaxSub}>
                  {v.done ? `Done ${v.completedDate ? safeDate(v.completedDate) : ''}` : `Scheduled ${safeDate(v.scheduledDate)}`}
                </Text>
              </View>
              <View style={[styles.badge, v.done ? styles.badgeUndo : styles.badgePending]}>
                <Text style={[styles.badgeText, v.done ? styles.badgeTextUndo : styles.badgeTextPending]}>
                  {v.done ? 'Undo' : 'Pending'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setConfirmVax(v.id)} disabled={mutating} hitSlop={8}>
                <Trash2 size={13} color={colors.mutedForeground} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <SectionHeader title="Appointments" disabled={mutating} onAdd={() => gateAdd(appointments.length, 'appointment', () => { setAptDoctor(''); setAptType(''); setShowApt(true); })} />
      {appointments.length === 0 ? (
        <EmptyState icon={<Calendar size={22} color={colors.mutedForeground} />} title="No appointments" desc="Schedule doctor visits and checkups." />
      ) : (
        <View style={styles.aptList}>
          {[...appointments].sort((a, b) => a.date.localeCompare(b.date)).map((apt) => (
            <TouchableOpacity
              key={apt.id}
              style={styles.aptItem}
              onPress={() => toggleApt(apt.id, apt.done)}
              disabled={mutating}
              activeOpacity={0.7}
            >
              <View style={[styles.aptCheck, apt.done ? styles.aptCheckDone : styles.aptCheckPending]}>
                {apt.done ? <Check size={14} color={colors.green600} /> : <Calendar size={13} color={colors.blue600} />}
              </View>
              <View style={styles.aptBody}>
                <Text style={[styles.aptType, apt.done && styles.aptTypeDone]}>{apt.type}</Text>
                <Text style={styles.aptSub}>{apt.doctor} · {apt.specialty}</Text>
                <Text style={styles.aptDate}>
                  {apt.done
                    ? `Done ${apt.completedDate ? safeDate(apt.completedDate) : ''}`
                    : `${safeDate(apt.date)} · ${apt.time}`}
                </Text>
              </View>
              <View style={[styles.badge, apt.done ? styles.badgeUndo : styles.badgePending]}>
                <Text style={[styles.badgeText, apt.done ? styles.badgeTextUndo : styles.badgeTextPending]}>
                  {apt.done ? 'Undo' : 'Mark done'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setConfirmApt(apt.id)} disabled={mutating} hitSlop={8}>
                <Trash2 size={14} color={colors.mutedForeground} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <SectionHeader title="Medical Notes" disabled={mutating} onAdd={() => gateAdd(medNotes.length, 'med_note', () => { setNoteTitle(''); setNoteContent(''); setNoteDate(new Date()); setShowNote(true); })} />
      {medNotes.length === 0 ? (
        <EmptyState icon={<MessageCircle size={22} color={colors.mutedForeground} />} title="No notes" desc="Record medical observations and doctor feedback." />
      ) : (
        <View style={styles.noteList}>
          {medNotes.map((n) => (
            <TouchableOpacity
              key={n.id}
              style={styles.noteItem}
              onPress={() => toggleNote(n.id, n.done)}
              disabled={mutating}
              activeOpacity={0.7}
            >
              <View style={[styles.noteCheck, n.done ? styles.noteCheckDone : styles.noteCheckPending]}>
                {n.done ? <Check size={14} color={colors.green600} /> : <MessageCircle size={13} color={colors.mutedForeground} />}
              </View>
              <View style={styles.noteBody}>
                <View style={styles.noteHeader}>
                  <Text style={[styles.noteTitle, n.done && styles.noteTitleDone]}>{n.title}</Text>
                  <Text style={styles.noteDate}>
                    {n.done ? `Done ${n.completedDate ? safeDate(n.completedDate) : ''}` : safeDate(n.date)}
                  </Text>
                </View>
                <Text style={styles.noteContent}>{n.content}</Text>
              </View>
              <View style={[styles.badge, n.done ? styles.badgeUndo : styles.badgePending]}>
                <Text style={[styles.badgeText, n.done ? styles.badgeTextUndo : styles.badgeTextPending]}>
                  {n.done ? 'Undo' : 'Mark done'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setConfirmNote(n.id)} disabled={mutating} hitSlop={8}>
                <Trash2 size={13} color={colors.mutedForeground} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ConfirmDeleteModal visible={!!confirmVax} message="This vaccination record will be permanently removed from the schedule." onConfirm={() => confirmVax && deleteVaccination(confirmVax)} onClose={() => setConfirmVax(null)} loading={mutating} />
      <ConfirmDeleteModal visible={!!confirmApt} message="This appointment will be permanently deleted." onConfirm={() => confirmApt && deleteAppointment(confirmApt)} onClose={() => setConfirmApt(null)} loading={mutating} />
      <ConfirmDeleteModal visible={!!confirmNote} message="This medical note will be permanently deleted." onConfirm={() => confirmNote && deleteMedNote(confirmNote)} onClose={() => setConfirmNote(null)} loading={mutating} />

      <Modal title="Add Vaccination" visible={showVax} onClose={() => setShowVax(false)} disableClose={mutating}>
        <FL>Vaccine Name</FL>
        <TI value={vaxName} onChangeText={setVaxName} placeholder="e.g. MMR, DTaP, Flu Shot…" />
        <DatePickerField label="Scheduled Date" value={vaxDate} onChange={setVaxDate} />
        <PBtn onPress={saveVax} loading={mutating} disabled={mutating}>Add Vaccination</PBtn>
      </Modal>

      <Modal title="Add Appointment" visible={showApt} onClose={() => setShowApt(false)} disableClose={mutating}>
        <FL>Appointment Type</FL>
        <TI value={aptType} onChangeText={setAptType} placeholder="e.g. 4-Month Checkup, Eye Exam…" />
        <FL>Doctor's Name</FL>
        <TI value={aptDoctor} onChangeText={setAptDoctor} placeholder="e.g. Dr. Sarah Miller" />
        <FL>Specialty</FL>
        <TI value={aptSpec} onChangeText={setAptSpec} placeholder="e.g. Pediatrician" />
        <DatePickerField label="Date" value={aptDate} onChange={setAptDate} />
        <TimePickerField label="Time" value={aptTime} onChange={setAptTime} />
        <PBtn onPress={saveApt} loading={mutating} disabled={mutating}>Add Appointment</PBtn>
      </Modal>

      <Modal title="Add Medical Note" visible={showNote} onClose={() => setShowNote(false)} disableClose={mutating}>
        <FL>Title</FL>
        <TI value={noteTitle} onChangeText={setNoteTitle} placeholder="e.g. 2-Month Checkup, Prescription…" />
        <DatePickerField label="Date" value={noteDate} onChange={setNoteDate} maximumDate={new Date()} />
        <FL>Notes</FL>
        <TI value={noteContent} onChangeText={setNoteContent} placeholder="Doctor's observations, medications, concerns…" multiline />
        <PBtn onPress={saveNote} loading={mutating} disabled={mutating}>Save Note</PBtn>
      </Modal>
    </ScrollView>
  );
}

function SectionHeader({ title, onAdd, disabled }: { title: string; onAdd: () => void; disabled?: boolean }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionLabel}>{title}</Text>
      <TouchableOpacity onPress={onAdd} disabled={disabled} style={[styles.addBtn, disabled && styles.disabledBtn]}>
        <Plus size={12} color={colors.primary} />
        <Text style={styles.addText}>Add</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32, gap: 16 },
  title: { fontSize: 24, fontWeight: '700', color: colors.foreground },
  sub: { fontSize: 14, color: colors.mutedForeground, marginTop: 2 },
  alert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.rose50,
    borderWidth: 1,
    borderColor: colors.rose200,
    borderRadius: 16,
    padding: 16,
  },
  alertBody: { flex: 1 },
  alertTitle: { fontSize: 14, fontWeight: '700', color: colors.rose900 },
  alertName: { fontSize: 14, color: colors.rose700, marginTop: 2 },
  alertSub: { fontSize: 12, color: colors.rose600, marginTop: 4 },
  markDone: { backgroundColor: colors.rose500, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  markDoneText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 1 },
  scheduleHint: { fontSize: 12, color: colors.mutedForeground, marginBottom: 12, marginTop: -4 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  disabledBtn: { opacity: 0.5 },
  addText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  list: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  listBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  vaxItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 16 },
  vaxCheck: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  vaxDone: { backgroundColor: colors.green100 },
  vaxPending: { backgroundColor: colors.rose100 },
  vaxBody: { flex: 1 },
  vaxName: { fontSize: 14, fontWeight: '600', color: colors.foreground },
  vaxSub: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  badgeUndo: { backgroundColor: colors.muted },
  badgePending: { backgroundColor: colors.rose100 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  badgeTextUndo: { color: colors.mutedForeground },
  badgeTextPending: { color: colors.rose600 },
  aptList: { gap: 8 },
  aptItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
  },
  aptCheck: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  aptCheckDone: { backgroundColor: colors.green100 },
  aptCheckPending: { backgroundColor: colors.blue100 },
  aptBody: { flex: 1 },
  aptType: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  aptTypeDone: { color: colors.green700 },
  aptSub: { fontSize: 12, color: colors.mutedForeground },
  aptDate: { fontSize: 12, fontWeight: '600', color: colors.primary, marginTop: 4 },
  noteList: { gap: 8 },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
  },
  noteCheck: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  noteCheckDone: { backgroundColor: colors.green100 },
  noteCheckPending: { backgroundColor: colors.muted },
  noteBody: { flex: 1 },
  noteHeader: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  noteTitle: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  noteTitleDone: { color: colors.green700 },
  noteDate: { fontSize: 12, color: colors.mutedForeground },
  noteContent: { fontSize: 14, color: colors.mutedForeground, lineHeight: 20 },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { format } from 'date-fns';
import { ChevronLeft } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { FL, TI, PBtn, DatePickerField } from '../components/ui';
import { colors } from '../theme/colors';
import type { BabyProfile } from '../types';

export function BabySetupScreen() {
  const { onBabySetup } = useApp();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<BabyProfile['gender']>('girl');
  const [birthDate, setBirthDate] = useState(new Date());
  const [birthWeight, setBirthWeight] = useState('3.3');
  const [error, setError] = useState('');

  const goStep2 = () => {
    if (!name.trim()) {
      setError("Please enter your baby's name.");
      return;
    }
    setError('');
    setStep(2);
  };

  const finish = () => {
    const w = Number(birthWeight);
    if (!w || w < 0.5 || w > 6) {
      setError('Please enter a valid birth weight (0.5–6 kg).');
      return;
    }
    onBabySetup({
      name: name.trim(),
      gender,
      birthDate: format(birthDate, 'yyyy-MM-dd'),
      birthWeight: w,
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.progress}>
          {[1, 2].map((s) => (
            <View key={s} style={[styles.progressBar, step >= s && styles.progressActive]} />
          ))}
        </View>

        {step === 1 ? (
          <View>
            <Text style={styles.heading}>Tell us about your baby</Text>
            <Text style={styles.sub}>We'll personalize Bebio just for you.</Text>
            <View style={styles.gap}>
              <FL>Baby's Name</FL>
              <TI value={name} onChangeText={setName} placeholder="e.g. Emma, Noah, Lily…" />
              <FL>Gender</FL>
              <View style={styles.genderRow}>
                {([['girl', '👧 Girl'], ['boy', '👦 Boy']] as const).map(([g, label]) => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setGender(g)}
                    style={[styles.genderBtn, gender === g && styles.genderActive]}
                  >
                    <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PBtn onPress={goStep2}>Continue →</PBtn>
          </View>
        ) : (
          <View>
            <TouchableOpacity onPress={() => { setStep(1); setError(''); }} style={styles.back}>
              <ChevronLeft size={14} color={colors.mutedForeground} />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.heading}>When was {name} born?</Text>
            <Text style={styles.sub}>This helps us calculate age, milestones, and vaccines.</Text>
            <View style={styles.gap}>
              <DatePickerField label="Date of Birth" value={birthDate} onChange={setBirthDate} maximumDate={new Date()} />
              <FL>Birth Weight (kg)</FL>
              <TI value={birthWeight} onChangeText={setBirthWeight} placeholder="e.g. 3.3" keyboardType="decimal-pad" />
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PBtn onPress={finish}>Start tracking {name} 🎉</PBtn>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingVertical: 64 },
  progress: { flexDirection: 'row', gap: 8, marginBottom: 32 },
  progressBar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.muted },
  progressActive: { backgroundColor: colors.primary },
  heading: { fontSize: 24, fontWeight: '700', color: colors.foreground, marginBottom: 4 },
  sub: { fontSize: 14, color: colors.mutedForeground, marginBottom: 24 },
  gap: { gap: 0, marginBottom: 16 },
  genderRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  genderBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  genderActive: { borderColor: colors.primary, backgroundColor: colors.secondary },
  genderText: { fontSize: 14, fontWeight: '700', color: colors.mutedForeground },
  genderTextActive: { color: colors.primary },
  error: { fontSize: 12, color: colors.red500, fontWeight: '500', marginBottom: 8 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
  backText: { fontSize: 14, color: colors.mutedForeground },
});

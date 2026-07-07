import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { format } from 'date-fns';
import { ChevronLeft, Mars, Venus } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/Toast';
import { FL, TI, PBtn, DatePickerField } from '../components/ui';
import { keyboardAvoidingBehavior } from '../lib/platform';
import { colors } from '../theme/colors';
import type { BabyProfile } from '../types';
import {
  validateBabyName,
  validateBabyBirth,
  parseDecimalInput,
  hasErrors,
  firstError,
  clearFieldError,
  type FieldErrors,
} from '../lib/validation';

export function BabySetupScreen() {
  const { onBabySetup, loading } = useApp();
  const { showError, showSuccess } = useToast();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<BabyProfile['gender']>('girl');
  const [birthDate, setBirthDate] = useState(new Date());
  const [birthWeight, setBirthWeight] = useState('3.3');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const goStep2 = () => {
    const errors = validateBabyName(name);
    if (hasErrors(errors)) {
      setFieldErrors(errors);
      showError(firstError(errors));
      return;
    }
    setFieldErrors({});
    setStep(2);
  };

  const finish = async () => {
    const birthDateStr = format(birthDate, 'yyyy-MM-dd');
    const errors = validateBabyBirth(birthDateStr, birthWeight);
    if (hasErrors(errors)) {
      setFieldErrors(errors);
      showError(firstError(errors));
      return;
    }
    setFieldErrors({});
    const w = parseDecimalInput(birthWeight)!;
    try {
      await onBabySetup({
        name: name.trim(),
        gender,
        birthDate: birthDateStr,
        birthWeight: w,
      });
      showSuccess(`Welcome, ${name.trim()}!`);
    } catch {
      showError('Failed to save baby profile. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={keyboardAvoidingBehavior}
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
              <TI
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setFieldErrors((prev) => clearFieldError(prev, 'name'));
                }}
                placeholder="e.g. Emma, Noah, Lily…"
                error={fieldErrors.name}
              />
              <FL>Gender</FL>
              <View style={styles.genderRow}>
                {(
                  [
                    { value: 'girl' as const, label: 'Girl', Icon: Venus },
                    { value: 'boy' as const, label: 'Boy', Icon: Mars },
                  ] as const
                ).map(({ value, label, Icon }) => {
                  const active = gender === value;
                  return (
                    <TouchableOpacity
                      key={value}
                      onPress={() => setGender(value)}
                      style={[styles.genderBtn, active && styles.genderActive]}
                    >
                      <Icon
                        size={18}
                        color={active ? colors.primary : colors.mutedForeground}
                      />
                      <Text style={[styles.genderText, active && styles.genderTextActive]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            <PBtn onPress={goStep2}>Continue →</PBtn>
          </View>
        ) : (
          <View>
            <TouchableOpacity onPress={() => { setStep(1); setFieldErrors({}); }} style={styles.back}>
              <ChevronLeft size={14} color={colors.mutedForeground} />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.heading}>When was {name} born?</Text>
            <Text style={styles.sub}>This helps us calculate age, milestones, and vaccines.</Text>
            <View style={styles.gap}>
              <DatePickerField
                label="Date of Birth"
                value={birthDate}
                onChange={setBirthDate}
                maximumDate={new Date()}
                autoOpen
              />
              {fieldErrors.birthDate ? <Text style={styles.error}>{fieldErrors.birthDate}</Text> : null}
              <FL>Birth Weight (kg)</FL>
              <TI
                value={birthWeight}
                onChangeText={(text) => {
                  setBirthWeight(text);
                  setFieldErrors((prev) => clearFieldError(prev, 'birthWeight'));
                }}
                placeholder="e.g. 3.3"
                keyboardType="decimal-pad"
                error={fieldErrors.birthWeight}
              />
            </View>
            <PBtn onPress={finish} disabled={loading}>
              {loading ? <ActivityIndicator color={colors.primaryForeground} /> : `Start tracking ${name}`}
            </PBtn>
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
  gap: { marginBottom: 16 },
  genderRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  genderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  genderActive: { borderColor: colors.primary, backgroundColor: colors.secondary },
  genderText: { fontSize: 14, fontWeight: '700', color: colors.mutedForeground },
  genderTextActive: { color: colors.primary },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
  backText: { fontSize: 14, color: colors.mutedForeground },
  error: { fontSize: 12, color: colors.red500, fontWeight: '500', marginTop: -8, marginBottom: 8 },
});

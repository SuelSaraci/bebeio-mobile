import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { colors } from '../theme/colors';

interface ModalProps {
  title: string;
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ title, visible, onClose, children }: ModalProps) {
  return (
    <RNModal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

export function FL({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function TI({
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  secureTextEntry,
  multiline,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'decimal-pad';
  secureTextEntry?: boolean;
  multiline?: boolean;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.mutedForeground}
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry}
      multiline={multiline}
      style={[styles.input, multiline && styles.textarea]}
    />
  );
}

export function PBtn({
  children,
  onPress,
  disabled,
}: {
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.primaryBtn, disabled && styles.disabled]}
      activeOpacity={0.8}
    >
      <Text style={styles.primaryBtnText}>{children}</Text>
    </TouchableOpacity>
  );
}

export function EmptyState({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>{icon}</View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDesc}>{desc}</Text>
    </View>
  );
}

export function ConfirmDeleteModal({
  visible,
  message,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <RNModal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.confirmOverlay}>
        <View style={styles.confirmCard}>
          <View style={styles.confirmIcon}>
            <Text style={{ fontSize: 20 }}>🗑️</Text>
          </View>
          <Text style={styles.confirmTitle}>Delete this entry?</Text>
          <Text style={styles.confirmMsg}>{message}</Text>
          <View style={styles.confirmActions}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                onConfirm();
                onClose();
              }}
              style={styles.deleteBtn}
            >
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </RNModal>
  );
}

export function StatCard({
  icon,
  label,
  value,
  sub,
  iconBg,
  iconColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: iconBg }]}>
        {React.isValidElement(icon)
          ? React.cloneElement(icon as React.ReactElement<{ color?: string; size?: number }>, {
              color: iconColor,
              size: 16,
            })
          : icon}
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

export function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      {options.map((o) => (
        <TouchableOpacity
          key={o.value}
          onPress={() => onChange(o.value)}
          style={[styles.toggleBtn, value === o.value && styles.toggleActive]}
        >
          <Text style={[styles.toggleText, value === o.value && styles.toggleTextActive]}>
            {o.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function TimePickerField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Date;
  onChange: (d: Date) => void;
}) {
  const DateTimePicker = require('@react-native-community/datetimepicker').default;
  const [show, setShow] = React.useState(false);

  return (
    <View>
      <FL>{label}</FL>
      <TouchableOpacity onPress={() => setShow(true)} style={styles.input}>
        <Text style={styles.inputText}>
          {value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={value}
          mode="time"
          onChange={(_: unknown, d?: Date) => {
            setShow(Platform.OS === 'ios');
            if (d) onChange(d);
          }}
        />
      )}
    </View>
  );
}

export function DatePickerField({
  label,
  value,
  onChange,
  maximumDate,
}: {
  label: string;
  value: Date;
  onChange: (d: Date) => void;
  maximumDate?: Date;
}) {
  const DateTimePicker = require('@react-native-community/datetimepicker').default;
  const [show, setShow] = React.useState(false);

  return (
    <View>
      <FL>{label}</FL>
      <TouchableOpacity onPress={() => setShow(true)} style={styles.input}>
        <Text style={styles.inputText}>{value.toLocaleDateString()}</Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={value}
          mode="date"
          maximumDate={maximumDate}
          onChange={(_: unknown, d?: Date) => {
            setShow(Platform.OS === 'ios');
            if (d) onChange(d);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '700', color: colors.foreground },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.muted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.foreground,
    marginBottom: 12,
  },
  inputText: { fontSize: 14, color: colors.foreground },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: { color: colors.primaryForeground, fontSize: 14, fontWeight: '700' },
  disabled: { opacity: 0.5 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: colors.foreground, marginBottom: 4 },
  emptyDesc: { fontSize: 12, color: colors.mutedForeground, textAlign: 'center' },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  confirmCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  confirmIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.red100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  confirmTitle: { fontSize: 16, fontWeight: '700', color: colors.foreground, marginBottom: 4 },
  confirmMsg: { fontSize: 14, color: colors.mutedForeground, textAlign: 'center', marginBottom: 24 },
  confirmActions: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelText: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  deleteBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.red500,
    alignItems: 'center',
  },
  deleteText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: { fontSize: 24, fontWeight: '700', color: colors.foreground },
  statSub: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  toggleActive: { borderColor: colors.primary, backgroundColor: colors.secondary },
  toggleText: { fontSize: 13, fontWeight: '700', color: colors.mutedForeground },
  toggleTextActive: { color: colors.primary },
});

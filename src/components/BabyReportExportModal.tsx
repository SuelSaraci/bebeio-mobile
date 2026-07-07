import React, { useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { X, Download, FileText } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { useToast } from './Toast';
import { buildBabyReportHtml } from '../lib/babyReportHtml';
import { colors } from '../theme/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
}

function buildReportFileName(babyName: string): string {
  const safeName = babyName.trim().replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '') || 'baby';
  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss');
  return `Bebio-Health-Report-${safeName}-${timestamp}.pdf`;
}

export function BabyReportExportModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { showSuccess, showError } = useToast();
  const {
    baby,
    profile,
    feedings,
    sleepEntries,
    diapers,
    growth,
    vaccinations,
    appointments,
    milestones,
    medNotes,
  } = useApp();
  const [exporting, setExporting] = useState(false);

  const html = useMemo(() => {
    if (!baby) return '';
    return buildBabyReportHtml({
      baby,
      parentName: profile?.name,
      feedings,
      sleepEntries,
      diapers,
      growth,
      vaccinations,
      appointments,
      milestones,
      medNotes,
      generatedAt: new Date(),
    });
  }, [
    baby,
    profile?.name,
    feedings,
    sleepEntries,
    diapers,
    growth,
    vaccinations,
    appointments,
    milestones,
    medNotes,
    visible,
  ]);

  const downloadPdf = async () => {
    if (!baby || exporting) return;
    setExporting(true);
    try {
      const { uri } = await Print.printToFileAsync({ html });
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        showError('Sharing is not available on this device.');
        return;
      }
      const exportFile = new File(Paths.cache, buildReportFileName(baby.name));
      await new File(uri).copy(exportFile);
      await Sharing.shareAsync(exportFile.uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `${baby.name} — Bebio Health Report`,
      });
      showSuccess('Report ready — save or share the PDF');
      onClose();
    } catch {
      showError('Could not create the PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (!baby) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <View style={styles.topLeft}>
            <View style={styles.topIcon}>
              <FileText size={16} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.topTitle}>Health Report</Text>
              <Text style={styles.topSub}>{baby.name} · Preview</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close">
            <X size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <View style={styles.previewWrap}>
          {html ? (
            <WebView
              originWhitelist={['*']}
              source={{ html }}
              style={styles.webview}
              showsVerticalScrollIndicator={false}
              scalesPageToFit={Platform.OS === 'android'}
            />
          ) : (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          )}
        </View>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            style={[styles.downloadBtn, exporting && styles.downloadDisabled]}
            onPress={downloadPdf}
            disabled={exporting}
            activeOpacity={0.85}
          >
            {exporting ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <>
                <Download size={18} color={colors.primaryForeground} />
                <Text style={styles.downloadText}>Download PDF</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.hint}>Opens the share sheet — save to Files or send to your doctor.</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  topIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: { fontSize: 16, fontWeight: '700', color: colors.foreground },
  topSub: { fontSize: 12, color: colors.mutedForeground, marginTop: 1 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewWrap: {
    flex: 1,
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  webview: { flex: 1, backgroundColor: '#FFF8F4' },
  loader: { flex: 1, alignSelf: 'center' },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
    gap: 8,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
  },
  downloadDisabled: { opacity: 0.7 },
  downloadText: { color: colors.primaryForeground, fontSize: 16, fontWeight: '700' },
  hint: { fontSize: 11, color: colors.mutedForeground, textAlign: 'center', lineHeight: 16 },
});

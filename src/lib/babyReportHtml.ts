import { format } from 'date-fns';
import type {
  Appointment,
  BabyProfile,
  DiaperEntry,
  FeedingEntry,
  GrowthEntry,
  MedicalNote,
  Milestone,
  SleepEntry,
  Vaccination,
} from '../types';
import { calcDuration, getBabyAge, safeDate, safeFormatTime } from '../utils';
import { feedingDetail, feedingTitle } from '../components/FeedingList';

export interface BabyReportData {
  baby: BabyProfile;
  parentName?: string;
  feedings: FeedingEntry[];
  sleepEntries: SleepEntry[];
  diapers: DiaperEntry[];
  growth: GrowthEntry[];
  vaccinations: Vaccination[];
  appointments: Appointment[];
  milestones: Milestone[];
  medNotes: MedicalNote[];
  generatedAt?: Date;
}

function esc(text: string | number | undefined | null) {
  if (text == null) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function row(cells: string) {
  return `<tr>${cells}</tr>`;
}

function cell(text: string, cls = '') {
  return `<td class="${cls}">${text}</td>`;
}

function section(title: string, body: string, count?: number) {
  const badge = count != null ? `<span class="badge">${count}</span>` : '';
  return `
    <section class="section">
      <div class="section-head">
        <h2>${esc(title)}</h2>
        ${badge}
      </div>
      ${body}
    </section>`;
}

function emptyState(msg: string) {
  return `<p class="empty">${esc(msg)}</p>`;
}

function table(headers: string[], rows: string) {
  const head = headers.map((h) => `<th>${esc(h)}</th>`).join('');
  return `<table class="table"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`;
}

export function buildBabyReportHtml(data: BabyReportData): string {
  const generatedAt = data.generatedAt ?? new Date();
  const { baby } = data;

  const feedings = [...data.feedings].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 80);
  const sleep = [...data.sleepEntries].sort((a, b) => b.start.localeCompare(a.start)).slice(0, 50);
  const diapers = [...data.diapers].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 50);
  const growth = [...data.growth].sort((a, b) => b.date.localeCompare(a.date));
  const vax = [...data.vaccinations].sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  const apts = [...data.appointments].sort((a, b) => a.date.localeCompare(b.date));
  const milestones = [...data.milestones];
  const notes = [...data.medNotes].sort((a, b) => b.date.localeCompare(a.date));

  const doneVax = vax.filter((v) => v.done).length;
  const doneMs = milestones.filter((m) => m.done).length;

  const feedingRows = feedings.length
    ? feedings
        .map((f) =>
          row(
            [
              cell(safeDate(f.timestamp)),
              cell(safeFormatTime(f.timestamp)),
              cell(feedingTitle(f)),
              cell(feedingDetail(f) + (f.notes ? ` · ${f.notes}` : '')),
            ].join(''),
          ),
        )
        .join('')
    : '';

  const sleepRows = sleep.length
    ? sleep
        .map((s) =>
          row(
            [
              cell(safeDate(s.start)),
              cell(`${safeFormatTime(s.start)} – ${safeFormatTime(s.end)}`),
              cell(s.type === 'night' ? 'Night' : 'Nap'),
              cell(calcDuration(s.start, s.end) + (s.notes ? ` · ${s.notes}` : '')),
            ].join(''),
          ),
        )
        .join('')
    : '';

  const diaperRows = diapers.length
    ? diapers
        .map((d) =>
          row(
            [
              cell(safeDate(d.timestamp)),
              cell(safeFormatTime(d.timestamp)),
              cell(d.type === 'both' ? 'Wet & dirty' : d.type.charAt(0).toUpperCase() + d.type.slice(1)),
            ].join(''),
          ),
        )
        .join('')
    : '';

  const growthRows = growth.length
    ? growth
        .map((g) =>
          row(
            [
              cell(safeDate(g.date)),
              cell(g.weight != null ? `${g.weight} kg` : '—'),
              cell(g.height != null ? `${g.height} cm` : '—'),
              cell(g.headCirc != null ? `${g.headCirc} cm` : '—'),
            ].join(''),
          ),
        )
        .join('')
    : '';

  const vaxRows = vax.length
    ? vax
        .map((v) =>
          row(
            [
              cell(v.name),
              cell(safeDate(v.scheduledDate)),
              cell(v.done ? `Done ${v.completedDate ? safeDate(v.completedDate) : ''}` : 'Pending', v.done ? 'status-done' : 'status-pending'),
            ].join(''),
          ),
        )
        .join('')
    : '';

  const aptRows = apts.length
    ? apts
        .map((a) =>
          row(
            [
              cell(a.type),
              cell(a.doctor),
              cell(`${safeDate(a.date)} · ${a.time}`),
              cell(a.done ? `Done ${a.completedDate ? safeDate(a.completedDate) : ''}` : 'Scheduled', a.done ? 'status-done' : 'status-pending'),
            ].join(''),
          ),
        )
        .join('')
    : '';

  const msRows = milestones.length
    ? milestones
        .map((m) =>
          row(
            [
              cell(m.title),
              cell(m.expectedWeeks),
              cell(m.done ? `Achieved ${m.achievedDate ? safeDate(m.achievedDate) : ''}` : 'Pending', m.done ? 'status-done' : 'status-pending'),
            ].join(''),
          ),
        )
        .join('')
    : '';

  const noteBlocks = notes.length
    ? notes
        .map(
          (n) => `
        <div class="note-card">
          <div class="note-head">
            <strong>${esc(n.title)}</strong>
            <span>${esc(n.done ? `Done ${n.completedDate ? safeDate(n.completedDate) : ''}` : safeDate(n.date))}</span>
          </div>
          <p>${esc(n.content)}</p>
        </div>`,
        )
        .join('')
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Bebio Health Report — ${esc(baby.name)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #2C1810;
      background: #FFF8F4;
      line-height: 1.45;
      font-size: 11px;
    }
    .page { padding: 28px 24px 40px; max-width: 800px; margin: 0 auto; }
    .hero {
      background: linear-gradient(135deg, #D95C74 0%, #E11D48 100%);
      color: #fff;
      border-radius: 20px;
      padding: 24px;
      margin-bottom: 20px;
    }
    .brand { font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; opacity: 0.85; }
    .hero h1 { font-size: 26px; font-weight: 800; margin: 6px 0 4px; }
    .hero .sub { font-size: 13px; opacity: 0.9; }
    .meta { font-size: 10px; opacity: 0.75; margin-top: 12px; }
    .stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 22px;
    }
    .stat {
      background: #fff;
      border: 1px solid rgba(44,24,16,0.09);
      border-radius: 14px;
      padding: 12px 10px;
      text-align: center;
    }
    .stat .val { font-size: 18px; font-weight: 800; color: #D95C74; }
    .stat .lbl { font-size: 9px; font-weight: 700; color: #9B7B72; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
    .profile {
      background: #fff;
      border: 1px solid rgba(44,24,16,0.09);
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 22px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 16px;
    }
    .profile dt { font-size: 9px; font-weight: 700; color: #9B7B72; text-transform: uppercase; }
    .profile dd { font-size: 12px; font-weight: 600; margin-bottom: 4px; }
    .section { margin-bottom: 22px; page-break-inside: avoid; }
    .section-head { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
    .section h2 { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #9B7B72; }
    .badge {
      background: #FFF0EC;
      color: #D95C74;
      font-size: 9px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 10px;
    }
    .table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid rgba(44,24,16,0.09); }
    .table th {
      text-align: left;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #9B7B72;
      padding: 10px 12px;
      background: #F5EDE8;
      border-bottom: 1px solid rgba(44,24,16,0.09);
    }
    .table td { padding: 9px 12px; border-bottom: 1px solid rgba(44,24,16,0.06); font-size: 11px; vertical-align: top; }
    .table tr:last-child td { border-bottom: none; }
    .status-done { color: #15803D; font-weight: 700; }
    .status-pending { color: #BE123C; font-weight: 600; }
    .empty { color: #9B7B72; font-style: italic; padding: 12px; background: #fff; border-radius: 12px; border: 1px dashed rgba(44,24,16,0.12); }
    .note-card {
      background: #fff;
      border: 1px solid rgba(44,24,16,0.09);
      border-radius: 12px;
      padding: 12px;
      margin-bottom: 8px;
    }
    .note-head { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 6px; font-size: 11px; }
    .note-head span { color: #9B7B72; font-size: 10px; }
    .note-card p { color: #5c4038; white-space: pre-wrap; }
    .footer {
      margin-top: 28px;
      padding-top: 16px;
      border-top: 1px solid rgba(44,24,16,0.09);
      text-align: center;
      font-size: 9px;
      color: #9B7B72;
    }
  </style>
</head>
<body>
  <div class="page">
    <header class="hero">
      <div class="brand">Bebio Health Report</div>
      <h1>${esc(baby.name)}</h1>
      <p class="sub">${esc(getBabyAge(baby.birthDate))} · ${baby.gender === 'girl' ? 'Girl' : 'Boy'} · Born ${esc(safeDate(baby.birthDate))}</p>
      <p class="meta">Generated ${esc(format(generatedAt, "MMMM d, yyyy 'at' h:mm a"))}${data.parentName ? ` · Parent: ${esc(data.parentName)}` : ''}</p>
    </header>

    <div class="stats">
      <div class="stat"><div class="val">${data.feedings.length}</div><div class="lbl">Feedings</div></div>
      <div class="stat"><div class="val">${data.sleepEntries.length}</div><div class="lbl">Sleep logs</div></div>
      <div class="stat"><div class="val">${data.diapers.length}</div><div class="lbl">Diapers</div></div>
      <div class="stat"><div class="val">${doneVax}/${vax.length}</div><div class="lbl">Vaccines</div></div>
    </div>

    <dl class="profile">
      <div><dt>Birth date</dt><dd>${esc(safeDate(baby.birthDate))}</dd></div>
      <div><dt>Birth weight</dt><dd>${esc(baby.birthWeight)} kg</dd></div>
      <div><dt>Growth entries</dt><dd>${growth.length}</dd></div>
      <div><dt>Milestones achieved</dt><dd>${doneMs} of ${milestones.length}</dd></div>
    </dl>

    ${section('Feedings', feedings.length ? table(['Date', 'Time', 'Type', 'Details'], feedingRows) : emptyState('No feeding records yet.'), feedings.length)}
    ${section('Sleep', sleep.length ? table(['Date', 'Time', 'Type', 'Duration'], sleepRows) : emptyState('No sleep records yet.'), sleep.length)}
    ${section('Diaper changes', diapers.length ? table(['Date', 'Time', 'Type'], diaperRows) : emptyState('No diaper records yet.'), diapers.length)}
    ${section('Growth measurements', growth.length ? table(['Date', 'Weight', 'Height', 'Head'], growthRows) : emptyState('No growth measurements yet.'), growth.length)}
    ${section('Vaccinations', vax.length ? table(['Vaccine', 'Scheduled', 'Status'], vaxRows) : emptyState('No vaccinations on record.'), vax.length)}
    ${section('Appointments', apts.length ? table(['Type', 'Doctor', 'When', 'Status'], aptRows) : emptyState('No appointments scheduled.'), apts.length)}
    ${section('Milestones', milestones.length ? table(['Milestone', 'Expected', 'Status'], msRows) : emptyState('No milestones tracked.'), milestones.length)}
    ${section('Medical notes', notes.length ? noteBlocks : emptyState('No medical notes recorded.'), notes.length)}

    <footer class="footer">
      Bebio · Confidential health summary for ${esc(baby.name)}<br />
      This report is for personal use. Share with your pediatrician as needed.
    </footer>
  </div>
</body>
</html>`;
}

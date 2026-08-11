import ExcelJS from 'exceljs';
import { sanitizeExcelCell } from '@/lib/utils';

export interface SignatureData {
  place?: string;
  date?: string;
  supervisorTitle?: string;
  supervisorName?: string;
  supervisorNip?: string;
  teacherTitle?: string;
  teacherName?: string;
  teacherNip?: string;
}

function appendSignatureBlock(
  worksheet: ExcelJS.Worksheet,
  startRow: number,
  totalCols: number,
  headerInfo?: { teacherName?: string; nip?: string },
  signatureData?: SignatureData
) {
  const sigRow = startRow + 2;
  const leftCol = 'B';
  const rightColIndex = Math.max(4, totalCols - 2);
  const rightCol = getColumnLetter(rightColIndex);

  // Left Column (Supervisor / Principal)
  worksheet.getCell(`${leftCol}${sigRow}`).value = 'Mengetahui,';
  worksheet.getCell(`${leftCol}${sigRow + 1}`).value =
    signatureData?.supervisorTitle || 'Kepala Sekolah';
  worksheet.getCell(`${leftCol}${sigRow + 4}`).value =
    signatureData?.supervisorName || '';
  worksheet.getCell(`${leftCol}${sigRow + 5}`).value =
    `NIP. ${signatureData?.supervisorNip || '-'}`;

  // Right Column (Teacher / Wali Kelas)
  const placeDateStr = `${signatureData?.place || 'Bandung'}, ${signatureData?.date || ''}`;
  const teacherNipVal =
    signatureData?.teacherNip && signatureData.teacherNip.trim() !== '' && signatureData.teacherNip !== '-'
      ? signatureData.teacherNip
      : headerInfo?.nip && headerInfo.nip.trim() !== '' && headerInfo.nip !== '-'
        ? headerInfo.nip
        : '-';

  worksheet.getCell(`${rightCol}${sigRow}`).value = placeDateStr;
  worksheet.getCell(`${rightCol}${sigRow + 1}`).value =
    signatureData?.teacherTitle || 'Guru Kelas / Wali Kelas';
  worksheet.getCell(`${rightCol}${sigRow + 4}`).value =
    signatureData?.teacherName || headerInfo?.teacherName || '';
  worksheet.getCell(`${rightCol}${sigRow + 5}`).value =
    `NIP/NUPTK. ${teacherNipVal}`;

  // Fonts & Alignment
  const boldFont = { name: 'Arial', size: 10, bold: true };
  const nameFont = { name: 'Arial', size: 10, bold: true };
  const regularFont = { name: 'Arial', size: 9 };

  [`${leftCol}${sigRow}`, `${leftCol}${sigRow + 1}`, `${rightCol}${sigRow}`, `${rightCol}${sigRow + 1}`].forEach((cellId) => {
    const cell = worksheet.getCell(cellId);
    cell.font = boldFont;
    cell.alignment = { horizontal: 'left', vertical: 'middle' };
  });

  [`${leftCol}${sigRow + 4}`, `${rightCol}${sigRow + 4}`].forEach((cellId) => {
    const cell = worksheet.getCell(cellId);
    cell.font = nameFont;
    cell.alignment = { horizontal: 'left', vertical: 'middle' };
  });

  [`${leftCol}${sigRow + 5}`, `${rightCol}${sigRow + 5}`].forEach((cellId) => {
    const cell = worksheet.getCell(cellId);
    cell.font = regularFont;
    cell.alignment = { horizontal: 'left', vertical: 'middle' };
  });
}

export async function exportStudentsToExcel(students: any[]) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Daftar Siswa');

  // Columns definition
  worksheet.columns = [
    { header: 'No', key: 'no', width: 8 },
    { header: 'NIS', key: 'nis', width: 15 },
    { header: 'Nama Lengkap', key: 'name', width: 25 },
    { header: 'Kelas', key: 'className', width: 15 },
    { header: 'Jenis Kelamin', key: 'gender', width: 15 },
  ];

  // Styling header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = {
    name: 'Arial',
    family: 4,
    size: 11,
    bold: true,
    color: { argb: 'FFFFFFFF' },
  };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF059669' }, // Emerald-600
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // Add rows
  students.forEach((student, index) => {
    worksheet.addRow({
      no: index + 1,
      nis: sanitizeExcelCell(student.nis),
      name: sanitizeExcelCell(student.name),
      className: sanitizeExcelCell(student.className),
      gender: student.gender === 'L' ? 'Laki-laki (L)' : 'Perempuan (P)',
    });
  });

  // Border & padding alignment
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      };
      if (rowNumber > 1) {
        cell.font = { name: 'Arial', size: 10 };
      }
    });
  });

  // Generate buffer and trigger download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Laporan_Siswa_${new Date().toISOString().split('T')[0]}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
}

export async function exportAttendanceToExcel(
  attendanceData: any[],
  dateStr: string,
  headerInfo?: {
    schoolName: string;
    className: string;
    teacherName: string;
    nip: string;
  },
  signatureData?: SignatureData
) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Kehadiran');

  worksheet.columns = [
    { header: 'No', key: 'no', width: 8 },
    { header: 'NIS', key: 'nis', width: 15 },
    { header: 'Nama Lengkap', key: 'name', width: 25 },
    { header: 'Kelas', key: 'className', width: 15 },
    { header: 'Status Kehadiran', key: 'status', width: 20 },
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF059669' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  attendanceData.forEach((record, index) => {
    worksheet.addRow({
      no: index + 1,
      nis: sanitizeExcelCell(record.nis),
      name: sanitizeExcelCell(record.name),
      className: sanitizeExcelCell(record.className),
      status: sanitizeExcelCell(record.status),
    });
  });

  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      };
      if (rowNumber > 1) {
        cell.font = { name: 'Arial', size: 10 };
        // Highlight negative statuses
        if (cell.value === 'Alfa') {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFEE2E2' },
          }; // Light red
          cell.font = { color: { argb: 'FF991B1B' }, bold: true };
        } else if (cell.value === 'Sakit' || cell.value === 'Izin') {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FEF3C7' },
          }; // Light amber
          cell.font = { color: { argb: 'D97706' } };
        }
      }
    });
  });

  const lastRow = attendanceData.length + 1;
  appendSignatureBlock(worksheet, lastRow, 5, headerInfo, signatureData);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Laporan_Absensi_${dateStr}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
}

export async function exportGradesToExcel(
  gradesData: any[],
  subject: string,
  category: string,
) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Nilai');

  worksheet.columns = [
    { header: 'No', key: 'no', width: 8 },
    { header: 'NIS', key: 'nis', width: 15 },
    { header: 'Nama Lengkap', key: 'name', width: 25 },
    { header: 'Mata Pelajaran', key: 'subject', width: 20 },
    { header: 'Kategori', key: 'category', width: 15 },
    { header: 'Nilai', key: 'score', width: 12 },
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF059669' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  gradesData.forEach((record, index) => {
    worksheet.addRow({
      no: index + 1,
      nis: sanitizeExcelCell(record.nis),
      name: sanitizeExcelCell(record.name),
      subject: sanitizeExcelCell(subject),
      category: sanitizeExcelCell(category),
      score: record.score === '' ? 'Belum Dinilai' : Number(record.score),
    });
  });

  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      };
      if (rowNumber > 1) {
        cell.font = { name: 'Arial', size: 10 };
        // Highlight low grades (< 70)
        const cellValue = Number(cell.value);
        if (!isNaN(cellValue) && cellValue < 70) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFEE2E2' },
          }; // Light red
          cell.font = { color: { argb: 'FF991B1B' }, bold: true };
        }
      }
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Laporan_Nilai_${subject}_${category}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
}

export async function exportGradesRecapToExcel(
  recapData: any[],
  subject: string,
  kkm: number
) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Rekap Nilai');

  worksheet.columns = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'NIS', key: 'nis', width: 14 },
    { header: 'Nama Lengkap', key: 'name', width: 26 },
    { header: 'Kelas', key: 'className', width: 12 },
    { header: 'Tugas', key: 'tugas', width: 10 },
    { header: 'UH', key: 'uh', width: 10 },
    { header: 'UTS', key: 'uts', width: 10 },
    { header: 'UAS', key: 'uas', width: 10 },
    { header: 'Nilai Akhir', key: 'finalScore', width: 14 },
    { header: 'Status Ketuntasan', key: 'status', width: 18 },
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF059669' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  recapData.forEach((record, index) => {
    const isScored = record.finalScore !== '';
    const isPassed = isScored && Number(record.finalScore) >= kkm;
    const statusText = !isScored
      ? 'Belum Dinilai'
      : isPassed
        ? 'Tuntas'
        : 'Remedial';

    worksheet.addRow({
      no: index + 1,
      nis: sanitizeExcelCell(record.nis),
      name: sanitizeExcelCell(record.name),
      className: sanitizeExcelCell(record.className),
      tugas: record.tugas === '' ? '-' : Number(record.tugas),
      uh: record.uh === '' ? '-' : Number(record.uh),
      uts: record.uts === '' ? '-' : Number(record.uts),
      uas: record.uas === '' ? '-' : Number(record.uas),
      finalScore: record.finalScore === '' ? '-' : Number(record.finalScore),
      status: statusText,
    });
  });

  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      };
      if (rowNumber > 1) {
        cell.font = { name: 'Arial', size: 10 };
      }
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Laporan_Rekap_Nilai_${subject}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
}

export async function exportAllSubjectsGradesRecapToExcel(
  subjects: string[],
  recapData: any[],
  kkm: number
) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Leger Nilai Kelas');

  const columns: any[] = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'NIS', key: 'nis', width: 14 },
    { header: 'Nama Lengkap', key: 'name', width: 26 },
    { header: 'Kelas', key: 'className', width: 12 },
  ];

  subjects.forEach((subj, idx) => {
    columns.push({ header: subj, key: `subj_${idx}`, width: 16 });
  });

  columns.push(
    { header: 'Rata-Rata Rapor', key: 'overallAverage', width: 16 },
    { header: 'Status Ketuntasan', key: 'status', width: 18 }
  );

  worksheet.columns = columns;

  const headerRow = worksheet.getRow(1);
  headerRow.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF059669' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  recapData.forEach((record, index) => {
    const isScored = record.overallAverage !== '';
    const isPassed = isScored && Number(record.overallAverage) >= kkm;
    const statusText = !isScored
      ? 'Belum Ada Nilai'
      : isPassed
        ? 'Tuntas'
        : 'Remedial';

    const rowObj: any = {
      no: index + 1,
      nis: sanitizeExcelCell(record.nis),
      name: sanitizeExcelCell(record.name),
      className: sanitizeExcelCell(record.className),
      overallAverage: record.overallAverage === '' ? '-' : Number(record.overallAverage),
      status: statusText,
    };

    subjects.forEach((subj, idx) => {
      const score = record.subjectScores[subj];
      rowObj[`subj_${idx}`] = score === '' || score === undefined ? '-' : Number(score);
    });

    worksheet.addRow(rowObj);
  });

  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      };
      if (rowNumber > 1) {
        cell.font = { name: 'Arial', size: 10 };
      }
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Leger_Rekap_Nilai_Semua_Mata_Pelajaran.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
}



export async function exportSavingsToExcel(savingsSummary: any[]) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Ringkasan Tabungan');

  worksheet.columns = [
    { header: 'No', key: 'no', width: 8 },
    { header: 'NIS', key: 'nis', width: 15 },
    { header: 'Nama Lengkap', key: 'name', width: 25 },
    { header: 'Kelas', key: 'className', width: 15 },
    { header: 'Jumlah Transaksi', key: 'txCount', width: 18 },
    { header: 'Saldo Tabungan', key: 'balance', width: 20 },
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF059669' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  savingsSummary.forEach((record, index) => {
    worksheet.addRow({
      no: index + 1,
      nis: sanitizeExcelCell(record.nis),
      name: sanitizeExcelCell(record.name),
      className: sanitizeExcelCell(record.className),
      txCount: record.transactionsCount,
      balance: record.balance,
    });
  });

  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      };
      if (rowNumber > 1) {
        cell.font = { name: 'Arial', size: 10 };
        // Format money
        if (colNumber === 6) {
          cell.numFmt = '"Rp"#,##0;("-Rp"#,##0);"-"';
        }
      }
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Laporan_Tabungan_Kelas_${new Date().toISOString().split('T')[0]}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
}

export async function exportJournalToExcel(
  headerInfo: {
    schoolName: string;
    subject: string;
    classNameSemester: string;
    academicYear: string;
    curriculum: string;
    teacherName: string;
    nip: string;
  },
  journalEntries: any[]
) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Jurnal Harian Guru');

  // Page setup for landscape printing
  worksheet.pageSetup.orientation = 'landscape';
  worksheet.pageSetup.fitToPage = true;

  // Title
  worksheet.mergeCells('A1:J1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'JURNAL HARIAN GURU';
  titleCell.font = { name: 'Arial', size: 14, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Metadata Info
  worksheet.getCell('A3').value = 'Sekolah';
  worksheet.getCell('B3').value = `: ${headerInfo.schoolName || '-'}`;
  worksheet.getCell('G3').value = 'Kurikulum';
  worksheet.getCell('H3').value = `: ${headerInfo.curriculum || '-'}`;

  worksheet.getCell('A4').value = 'Mata Pelajaran';
  worksheet.getCell('B4').value = `: ${headerInfo.subject || '-'}`;
  worksheet.getCell('G4').value = 'Nama Guru';
  worksheet.getCell('H4').value = `: ${headerInfo.teacherName || '-'}`;

  worksheet.getCell('A5').value = 'Kelas/Semester';
  worksheet.getCell('B5').value = `: ${headerInfo.classNameSemester || '-'}`;
  worksheet.getCell('G5').value = 'NIP/NUPTK';
  worksheet.getCell('H5').value = `: ${headerInfo.nip || '-'}`;

  worksheet.getCell('A6').value = 'Tahun Pelajaran';
  worksheet.getCell('B6').value = `: ${headerInfo.academicYear || '-'}`;

  ['A3', 'A4', 'A5', 'A6', 'G3', 'G4', 'G5'].forEach((cellId) => {
    worksheet.getCell(cellId).font = { name: 'Arial', size: 10, bold: true };
  });

  // Table Headers (Row 8 & Row 9)
  worksheet.mergeCells('A8:A9');
  worksheet.getCell('A8').value = 'No.';

  worksheet.mergeCells('B8:B9');
  worksheet.getCell('B8').value = 'Hari / Tanggal';

  worksheet.mergeCells('C8:C9');
  worksheet.getCell('C8').value = 'Pertemuan ke-';

  worksheet.mergeCells('D8:D9');
  worksheet.getCell('D8').value = 'Kompetensi Dasar';

  worksheet.mergeCells('E8:E9');
  worksheet.getCell('E8').value = 'Materi';

  worksheet.mergeCells('F8:F9');
  worksheet.getCell('F8').value = 'Kegiatan Belajar Mengajar';

  worksheet.mergeCells('G8:I8');
  worksheet.getCell('G8').value = 'Absensi Siswa';

  worksheet.getCell('G9').value = 'S';
  worksheet.getCell('H9').value = 'I';
  worksheet.getCell('I9').value = 'A';

  worksheet.mergeCells('J8:J9');
  worksheet.getCell('J8').value = 'Keterangan';

  // Apply styling to table headers (Rows 8 & 9)
  const headerFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE2E8F0' }, // light slate gray header
  };

  ['A8', 'B8', 'C8', 'D8', 'E8', 'F8', 'G8', 'G9', 'H9', 'I9', 'J8'].forEach(
    (cellId) => {
      const cell = worksheet.getCell(cellId);
      cell.font = { name: 'Arial', size: 10, bold: true };
      cell.fill = headerFill as any;
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    }
  );

  // Define Column Widths
  worksheet.getColumn(1).width = 6;  // No
  worksheet.getColumn(2).width = 18; // Hari/Tanggal
  worksheet.getColumn(3).width = 12; // Pertemuan
  worksheet.getColumn(4).width = 30; // KD
  worksheet.getColumn(5).width = 25; // Materi
  worksheet.getColumn(6).width = 35; // KBM
  worksheet.getColumn(7).width = 5;  // S
  worksheet.getColumn(8).width = 5;  // I
  worksheet.getColumn(9).width = 5;  // A
  worksheet.getColumn(10).width = 25; // Keterangan

  // Populate Journal Entries starting at row 10
  let currentRow = 10;
  journalEntries.forEach((entry, index) => {
    const formattedDate = new Date(entry.date).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const row = worksheet.getRow(currentRow);
    row.getCell(1).value = index + 1;
    row.getCell(2).value = formattedDate;
    row.getCell(3).value = entry.meetingNo;
    row.getCell(4).value = sanitizeExcelCell(entry.basicCompetency);
    row.getCell(5).value = sanitizeExcelCell(entry.material);
    row.getCell(6).value = sanitizeExcelCell(entry.learningActivity);
    row.getCell(7).value = entry.absentS || '';
    row.getCell(8).value = entry.absentI || '';
    row.getCell(9).value = entry.absentA || '';
    row.getCell(10).value = sanitizeExcelCell(entry.notes || '');

    // Cell alignments
    row.getCell(1).alignment = { horizontal: 'center', vertical: 'top' };
    row.getCell(2).alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
    row.getCell(3).alignment = { horizontal: 'center', vertical: 'top' };
    row.getCell(4).alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
    row.getCell(5).alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
    row.getCell(6).alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
    row.getCell(7).alignment = { horizontal: 'center', vertical: 'top' };
    row.getCell(8).alignment = { horizontal: 'center', vertical: 'top' };
    row.getCell(9).alignment = { horizontal: 'center', vertical: 'top' };
    row.getCell(10).alignment = { horizontal: 'left', vertical: 'top', wrapText: true };

    currentRow++;
  });

  // Apply borders to table
  for (let r = 8; r < currentRow; r++) {
    const row = worksheet.getRow(r);
    for (let c = 1; c <= 10; c++) {
      const cell = row.getCell(c);
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF94A3B8' } },
        left: { style: 'thin', color: { argb: 'FF94A3B8' } },
        bottom: { style: 'thin', color: { argb: 'FF94A3B8' } },
        right: { style: 'thin', color: { argb: 'FF94A3B8' } },
      };
      if (r >= 10) {
        cell.font = { name: 'Arial', size: 10 };
      }
    }
  }

  // Generate buffer & trigger download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Jurnal_Harian_Guru_${new Date().toISOString().split('T')[0]}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
}

function getColumnLetter(colIndex: number): string {
  let temp;
  let letter = '';
  while (colIndex > 0) {
    temp = (colIndex - 1) % 26;
    letter = String.fromCharCode(65 + temp) + letter;
    colIndex = Math.floor((colIndex - temp - 1) / 26);
  }
  return letter;
}

export async function exportWeeklyAttendanceToExcel(
  reportData: {
    startDateStr: string;
    endDateStr: string;
    datesList: string[];
    studentsReport: any[];
  },
  weekLabel: string,
  headerInfo: {
    schoolName: string;
    className: string;
    teacherName: string;
    nip: string;
  },
  signatureData?: SignatureData
) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Rekap Absensi Mingguan');
  worksheet.pageSetup.orientation = 'landscape';
  worksheet.pageSetup.fitToPage = true;

  const datesCount = reportData.datesList.length;
  const totalCols = 4 + datesCount + 5;
  const lastColLetter = getColumnLetter(totalCols);

  worksheet.mergeCells(`A1:${lastColLetter}1`);
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `LAPORAN REKAPITULASI ABSENSI SISWA (${weekLabel.toUpperCase()})`;
  titleCell.font = { name: 'Arial', size: 14, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.getCell('A3').value = 'Nama Sekolah';
  worksheet.getCell('B3').value = `: ${headerInfo.schoolName || '-'}`;
  worksheet.getCell('A4').value = 'Kelas';
  worksheet.getCell('B4').value = `: ${headerInfo.className || '-'}`;

  worksheet.getCell('E3').value = 'Guru Kelas';
  worksheet.getCell('F3').value = `: ${headerInfo.teacherName || '-'}`;
  worksheet.getCell('E4').value = 'NIP/NUPTK';
  worksheet.getCell('F4').value = `: ${headerInfo.nip || '-'}`;

  ['A3', 'A4', 'E3', 'E4'].forEach((c) => {
    worksheet.getCell(c).font = { name: 'Arial', size: 10, bold: true };
  });

  worksheet.getCell('A6').value = 'No';
  worksheet.getCell('B6').value = 'NIS';
  worksheet.getCell('C6').value = 'Nama Lengkap';
  worksheet.getCell('D6').value = 'L/P';

  const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  reportData.datesList.forEach((dStr, idx) => {
    const colIndex = 4 + idx + 1;
    const colLetter = getColumnLetter(colIndex);
    const [y, m, d] = dStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const dayName = DAY_NAMES[dt.getDay()];
    worksheet.getCell(`${colLetter}6`).value = `${dayName}\n${d}/${m}`;
  });

  const startSummaryCol = 4 + datesCount + 1;
  worksheet.getCell(`${getColumnLetter(startSummaryCol)}6`).value = 'H';
  worksheet.getCell(`${getColumnLetter(startSummaryCol + 1)}6`).value = 'S';
  worksheet.getCell(`${getColumnLetter(startSummaryCol + 2)}6`).value = 'I';
  worksheet.getCell(`${getColumnLetter(startSummaryCol + 3)}6`).value = 'A';
  worksheet.getCell(`${getColumnLetter(startSummaryCol + 4)}6`).value = '%';

  for (let c = 1; c <= totalCols; c++) {
    const cell = worksheet.getCell(`${getColumnLetter(c)}6`);
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF059669' },
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  }

  worksheet.getColumn(1).width = 5;
  worksheet.getColumn(2).width = 14;
  worksheet.getColumn(3).width = 25;
  worksheet.getColumn(4).width = 6;

  for (let d = 0; d < datesCount; d++) {
    worksheet.getColumn(4 + d + 1).width = 9;
  }
  worksheet.getColumn(startSummaryCol).width = 5;
  worksheet.getColumn(startSummaryCol + 1).width = 5;
  worksheet.getColumn(startSummaryCol + 2).width = 5;
  worksheet.getColumn(startSummaryCol + 3).width = 5;
  worksheet.getColumn(startSummaryCol + 4).width = 7;

  let currentRow = 7;
  reportData.studentsReport.forEach((student, index) => {
    const row = worksheet.getRow(currentRow);
    row.getCell(1).value = index + 1;
    row.getCell(2).value = sanitizeExcelCell(student.nis);
    row.getCell(3).value = sanitizeExcelCell(student.name);
    row.getCell(4).value = student.gender || '-';

    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(3).alignment = { horizontal: 'left', vertical: 'middle' };
    row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };

    reportData.datesList.forEach((dStr, idx) => {
      const colIndex = 4 + idx + 1;
      const status = student.dailyMap ? student.dailyMap[dStr] : '';
      let code = '';
      if (status === 'Hadir') code = 'H';
      else if (status === 'Sakit') code = 'S';
      else if (status === 'Izin') code = 'I';
      else if (status === 'Alfa') code = 'A';

      const cell = row.getCell(colIndex);
      cell.value = code;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };

      if (code === 'A') {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        cell.font = { color: { argb: 'FF991B1B' }, bold: true, name: 'Arial', size: 9 };
      } else if (code === 'S' || code === 'I') {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF3C7' } };
        cell.font = { color: { argb: 'D97706' }, bold: true, name: 'Arial', size: 9 };
      }
    });

    row.getCell(startSummaryCol).value = student.hadir;
    row.getCell(startSummaryCol + 1).value = student.sakit;
    row.getCell(startSummaryCol + 2).value = student.izin;
    row.getCell(startSummaryCol + 3).value = student.alfa;
    row.getCell(startSummaryCol + 4).value = `${student.percentage}%`;

    for (let i = 0; i < 5; i++) {
      row.getCell(startSummaryCol + i).alignment = { horizontal: 'center', vertical: 'middle' };
    }

    currentRow++;
  });

  for (let r = 6; r < currentRow; r++) {
    const row = worksheet.getRow(r);
    for (let c = 1; c <= totalCols; c++) {
      const cell = row.getCell(c);
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      };
    }
  }

  appendSignatureBlock(worksheet, currentRow, totalCols, headerInfo, signatureData);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Laporan_Absensi_Mingguan_${weekLabel.replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
}

export async function exportMonthlyAttendanceToExcel(
  reportData: {
    year: number;
    month: number;
    daysInMonth: number;
    studentsReport: any[];
  },
  monthLabel: string,
  headerInfo: {
    schoolName: string;
    className: string;
    teacherName: string;
    nip: string;
  },
  signatureData?: SignatureData
) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Rekap Absensi Bulanan');
  worksheet.pageSetup.orientation = 'landscape';
  worksheet.pageSetup.fitToPage = true;

  const totalCols = 4 + reportData.daysInMonth + 5;
  const lastColLetter = getColumnLetter(totalCols);

  worksheet.mergeCells(`A1:${lastColLetter}1`);
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `LAPORAN REKAPITULASI ABSENSI BULAN ${monthLabel.toUpperCase()} ${reportData.year}`;
  titleCell.font = { name: 'Arial', size: 14, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.getCell('A3').value = 'Nama Sekolah';
  worksheet.getCell('B3').value = `: ${headerInfo.schoolName || '-'}`;
  worksheet.getCell('A4').value = 'Kelas';
  worksheet.getCell('B4').value = `: ${headerInfo.className || '-'}`;

  worksheet.getCell('E3').value = 'Guru Kelas';
  worksheet.getCell('F3').value = `: ${headerInfo.teacherName || '-'}`;
  worksheet.getCell('E4').value = 'NIP/NUPTK';
  worksheet.getCell('F4').value = `: ${headerInfo.nip || '-'}`;

  ['A3', 'A4', 'E3', 'E4'].forEach((c) => {
    worksheet.getCell(c).font = { name: 'Arial', size: 10, bold: true };
  });

  worksheet.getCell('A6').value = 'No';
  worksheet.getCell('B6').value = 'NIS';
  worksheet.getCell('C6').value = 'Nama Lengkap';
  worksheet.getCell('D6').value = 'L/P';

  for (let d = 1; d <= reportData.daysInMonth; d++) {
    const colIndex = 4 + d;
    const colLetter = getColumnLetter(colIndex);
    worksheet.getCell(`${colLetter}6`).value = d;
  }

  const startSummaryCol = 4 + reportData.daysInMonth + 1;
  worksheet.getCell(`${getColumnLetter(startSummaryCol)}6`).value = 'H';
  worksheet.getCell(`${getColumnLetter(startSummaryCol + 1)}6`).value = 'S';
  worksheet.getCell(`${getColumnLetter(startSummaryCol + 2)}6`).value = 'I';
  worksheet.getCell(`${getColumnLetter(startSummaryCol + 3)}6`).value = 'A';
  worksheet.getCell(`${getColumnLetter(startSummaryCol + 4)}6`).value = '%';

  for (let c = 1; c <= totalCols; c++) {
    const cell = worksheet.getCell(`${getColumnLetter(c)}6`);
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF059669' },
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  }

  worksheet.getColumn(1).width = 5;
  worksheet.getColumn(2).width = 14;
  worksheet.getColumn(3).width = 25;
  worksheet.getColumn(4).width = 6;

  for (let d = 1; d <= reportData.daysInMonth; d++) {
    worksheet.getColumn(4 + d).width = 4;
  }
  worksheet.getColumn(startSummaryCol).width = 5;
  worksheet.getColumn(startSummaryCol + 1).width = 5;
  worksheet.getColumn(startSummaryCol + 2).width = 5;
  worksheet.getColumn(startSummaryCol + 3).width = 5;
  worksheet.getColumn(startSummaryCol + 4).width = 7;

  let currentRow = 7;
  reportData.studentsReport.forEach((student, index) => {
    const row = worksheet.getRow(currentRow);
    row.getCell(1).value = index + 1;
    row.getCell(2).value = sanitizeExcelCell(student.nis);
    row.getCell(3).value = sanitizeExcelCell(student.name);
    row.getCell(4).value = student.gender || '-';

    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(3).alignment = { horizontal: 'left', vertical: 'middle' };
    row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };

    for (let d = 1; d <= reportData.daysInMonth; d++) {
      const colIndex = 4 + d;
      const status = student.dailyMap[d];
      let code = '';
      if (status === 'Hadir') code = 'H';
      else if (status === 'Sakit') code = 'S';
      else if (status === 'Izin') code = 'I';
      else if (status === 'Alfa') code = 'A';

      const cell = row.getCell(colIndex);
      cell.value = code;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };

      if (code === 'A') {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        cell.font = { color: { argb: 'FF991B1B' }, bold: true, name: 'Arial', size: 9 };
      } else if (code === 'S' || code === 'I') {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF3C7' } };
        cell.font = { color: { argb: 'D97706' }, bold: true, name: 'Arial', size: 9 };
      }
    }

    row.getCell(startSummaryCol).value = student.hadir;
    row.getCell(startSummaryCol + 1).value = student.sakit;
    row.getCell(startSummaryCol + 2).value = student.izin;
    row.getCell(startSummaryCol + 3).value = student.alfa;
    row.getCell(startSummaryCol + 4).value = `${student.percentage}%`;

    for (let i = 0; i < 5; i++) {
      row.getCell(startSummaryCol + i).alignment = { horizontal: 'center', vertical: 'middle' };
    }

    currentRow++;
  });

  for (let r = 6; r < currentRow; r++) {
    const row = worksheet.getRow(r);
    for (let c = 1; c <= totalCols; c++) {
      const cell = row.getCell(c);
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      };
    }
  }

  appendSignatureBlock(worksheet, currentRow, totalCols, headerInfo, signatureData);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Laporan_Absensi_Bulanan_${monthLabel}_${reportData.year}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
}

export async function exportYearlyAttendanceToExcel(
  reportData: {
    year: number;
    studentsReport: any[];
  },
  headerInfo: {
    schoolName: string;
    className: string;
    teacherName: string;
    nip: string;
  },
  signatureData?: SignatureData
) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Rekap Absensi Tahunan');
  worksheet.pageSetup.orientation = 'landscape';
  worksheet.pageSetup.fitToPage = true;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
  const totalCols = 4 + 12 + 5;
  const lastColLetter = getColumnLetter(totalCols);

  worksheet.mergeCells(`A1:${lastColLetter}1`);
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `LAPORAN REKAPITULASI ABSENSI SISWA TAHUN ${reportData.year}`;
  titleCell.font = { name: 'Arial', size: 14, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.getCell('A3').value = 'Nama Sekolah';
  worksheet.getCell('B3').value = `: ${headerInfo.schoolName || '-'}`;
  worksheet.getCell('A4').value = 'Kelas';
  worksheet.getCell('B4').value = `: ${headerInfo.className || '-'}`;

  worksheet.getCell('E3').value = 'Guru Kelas';
  worksheet.getCell('F3').value = `: ${headerInfo.teacherName || '-'}`;
  worksheet.getCell('E4').value = 'NIP/NUPTK';
  worksheet.getCell('F4').value = `: ${headerInfo.nip || '-'}`;

  ['A3', 'A4', 'E3', 'E4'].forEach((c) => {
    worksheet.getCell(c).font = { name: 'Arial', size: 10, bold: true };
  });

  worksheet.getCell('A6').value = 'No';
  worksheet.getCell('B6').value = 'NIS';
  worksheet.getCell('C6').value = 'Nama Lengkap';
  worksheet.getCell('D6').value = 'L/P';

  months.forEach((m, idx) => {
    const colLetter = getColumnLetter(4 + idx + 1);
    worksheet.getCell(`${colLetter}6`).value = m;
  });

  const startSummaryCol = 4 + 12 + 1;
  worksheet.getCell(`${getColumnLetter(startSummaryCol)}6`).value = 'Tot. H';
  worksheet.getCell(`${getColumnLetter(startSummaryCol + 1)}6`).value = 'Tot. S';
  worksheet.getCell(`${getColumnLetter(startSummaryCol + 2)}6`).value = 'Tot. I';
  worksheet.getCell(`${getColumnLetter(startSummaryCol + 3)}6`).value = 'Tot. A';
  worksheet.getCell(`${getColumnLetter(startSummaryCol + 4)}6`).value = '% Kehadiran';

  for (let c = 1; c <= totalCols; c++) {
    const cell = worksheet.getCell(`${getColumnLetter(c)}6`);
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF059669' },
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  }

  worksheet.getColumn(1).width = 5;
  worksheet.getColumn(2).width = 14;
  worksheet.getColumn(3).width = 25;
  worksheet.getColumn(4).width = 6;
  for (let i = 1; i <= 12; i++) {
    worksheet.getColumn(4 + i).width = 6;
  }
  worksheet.getColumn(startSummaryCol).width = 8;
  worksheet.getColumn(startSummaryCol + 1).width = 8;
  worksheet.getColumn(startSummaryCol + 2).width = 8;
  worksheet.getColumn(startSummaryCol + 3).width = 8;
  worksheet.getColumn(startSummaryCol + 4).width = 13;

  let currentRow = 7;
  reportData.studentsReport.forEach((student, index) => {
    const row = worksheet.getRow(currentRow);
    row.getCell(1).value = index + 1;
    row.getCell(2).value = sanitizeExcelCell(student.nis);
    row.getCell(3).value = sanitizeExcelCell(student.name);
    row.getCell(4).value = student.gender || '-';

    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(3).alignment = { horizontal: 'left', vertical: 'middle' };
    row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };

    student.monthlyBreakdown.forEach((mb: any, idx: number) => {
      const cell = row.getCell(4 + idx + 1);
      cell.value = mb.hadir > 0 ? mb.hadir : '-';
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    row.getCell(startSummaryCol).value = student.hadir;
    row.getCell(startSummaryCol + 1).value = student.sakit;
    row.getCell(startSummaryCol + 2).value = student.izin;
    row.getCell(startSummaryCol + 3).value = student.alfa;
    row.getCell(startSummaryCol + 4).value = `${student.percentage}%`;

    for (let i = 0; i < 5; i++) {
      row.getCell(startSummaryCol + i).alignment = { horizontal: 'center', vertical: 'middle' };
    }

    currentRow++;
  });

  for (let r = 6; r < currentRow; r++) {
    const row = worksheet.getRow(r);
    for (let c = 1; c <= totalCols; c++) {
      const cell = row.getCell(c);
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      };
    }
  }

  appendSignatureBlock(worksheet, currentRow, totalCols, headerInfo, signatureData);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Laporan_Absensi_Tahunan_${reportData.year}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
}


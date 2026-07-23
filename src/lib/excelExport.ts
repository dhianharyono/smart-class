import ExcelJS from 'exceljs';
import { sanitizeExcelCell } from '@/lib/utils';

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
  worksheet.getCell('G5').value = 'NIP';
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

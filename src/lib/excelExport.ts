import ExcelJS from 'exceljs';

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
      nis: student.nis,
      name: student.name,
      className: student.className,
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
      nis: record.nis,
      name: record.name,
      className: record.className,
      status: record.status,
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
      nis: record.nis,
      name: record.name,
      subject,
      category,
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
      nis: record.nis,
      name: record.name,
      className: record.className,
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
  a.download = `Laporan_Jurnal_Kelas_${new Date().toISOString().split('T')[0]}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
}

/**
 * 자원관리시스템 사용자 매뉴얼 - Word 문서 생성
 */
const {
  Document, Packer, Paragraph, TextRun, ImageRun,
  HeadingLevel, AlignmentType, PageBreak,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  ShadingType, convertInchesToTwip, Spacing,
} = require('docx');
const fs = require('fs');
const path = require('path');

const IMG_DIR = path.join(__dirname, '../docs/screenshots');
const OUT     = path.join(__dirname, '../docs/자원관리시스템_사용자매뉴얼.docx');

// 이미지 로드 헬퍼
function img(filename, widthEmu = 5_500_000) {
  const filePath = path.join(IMG_DIR, filename);
  if (!fs.existsSync(filePath)) return null;
  const data = fs.readFileSync(filePath);
  const heightEmu = Math.round(widthEmu * (800 / 1280)); // 뷰포트 비율
  return new ImageRun({ data, transformation: { width: widthEmu / 9_525, height: heightEmu / 9_525 }, type: 'png' });
}

// 단락 헬퍼
const h1 = (text) => new Paragraph({
  text, heading: HeadingLevel.HEADING_1,
  spacing: { before: 400, after: 200 },
});
const h2 = (text) => new Paragraph({
  text, heading: HeadingLevel.HEADING_2,
  spacing: { before: 300, after: 150 },
});
const h3 = (text) => new Paragraph({
  text, heading: HeadingLevel.HEADING_3,
  spacing: { before: 200, after: 100 },
});
const body = (text) => new Paragraph({
  children: [new TextRun({ text, size: 22 })],
  spacing: { after: 100 },
});
const step = (num, text) => new Paragraph({
  children: [
    new TextRun({ text: `${num}. `, bold: true, size: 22, color: '1976D2' }),
    new TextRun({ text, size: 22 }),
  ],
  spacing: { after: 80 },
  indent: { left: convertInchesToTwip(0.2) },
});
const note = (text) => new Paragraph({
  children: [new TextRun({ text: `💡 ${text}`, size: 20, color: '0D47A1', italics: true })],
  spacing: { before: 80, after: 120 },
  indent: { left: convertInchesToTwip(0.3) },
  shading: { type: ShadingType.CLEAR, fill: 'E3F2FD' },
});
const warn = (text) => new Paragraph({
  children: [new TextRun({ text: `⚠️ ${text}`, size: 20, color: '8B4000', italics: true })],
  spacing: { before: 80, after: 120 },
  indent: { left: convertInchesToTwip(0.3) },
  shading: { type: ShadingType.CLEAR, fill: 'FFF8E1' },
});
const imgPara = (filename) => {
  const image = img(filename);
  if (!image) return null;
  return new Paragraph({
    children: [image],
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 200 },
  });
};
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });
const blank = () => new Paragraph({ text: '', spacing: { after: 80 } });

// 역할 표
function roleTable() {
  const cellStyle = (text, bold = false, color = '000000') =>
    new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text, bold, size: 20, color })] })],
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
    });
  const headerCell = (text) => new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20, color: 'FFFFFF' })] })],
    shading: { type: ShadingType.CLEAR, fill: '1976D2' },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
  });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [headerCell('권한'), headerCell('역할명'), headerCell('접근 가능 기능')] }),
      new TableRow({ children: [cellStyle('일반 사용자'), cellStyle('USER'), cellStyle('자산 조회, 회의실 예약, 법인차량 예약, 마이페이지')] }),
      new TableRow({ children: [cellStyle('자산 관리자'), cellStyle('ASSET_ADMIN'), cellStyle('일반 사용자 기능 + 자산 등록·수정·삭제·엑셀 업로드')] }),
      new TableRow({ children: [cellStyle('시스템 관리자'), cellStyle('SYSTEM_ADMIN'), cellStyle('전체 기능 + 사용자·부서·권한·메뉴 관리')] }),
    ],
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 문서 본문 구성
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const children = [];
const add = (...items) => items.forEach(i => i && children.push(i));

// ── 표지 ──────────────────────
add(
  new Paragraph({
    children: [new TextRun({ text: '자원관리시스템', size: 64, bold: true, color: '1A237E' })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 2000, after: 200 },
  }),
  new Paragraph({
    children: [new TextRun({ text: '사용자 매뉴얼', size: 48, color: '1976D2' })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
  }),
  new Paragraph({
    children: [new TextRun({ text: 'Resource Management System', size: 24, color: '888888' })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 600 },
  }),
  new Paragraph({
    children: [new TextRun({ text: '2026년 3월', size: 22, color: '555555' })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
  }),
  new Paragraph({
    children: [new TextRun({ text: '일반 사용자 · 관리자 통합 매뉴얼', size: 22, color: '555555' })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 2000 },
  }),
  pageBreak(),
);

// ── 1. 시스템 개요 ────────────
add(
  h1('1. 시스템 개요'),
  body('자원관리시스템은 회사 내 자산, 회의실, 법인차량을 한 곳에서 편리하게 관리할 수 있는 웹 기반 플랫폼입니다.'),
  body('접속 URL: http://localhost:3000  |  권장 브라우저: Chrome 최신 버전'),
  blank(),
  h2('1.1 주요 기능'),
  body('• 자산 관리: 데스크탑·노트북·서버·모니터 등록, 조회, 수정, 삭제, 엑셀 업로드/다운로드'),
  body('• 회의실 예약: 일별·주별 스케줄러로 회의실 예약 현황 조회 및 예약 생성·취소'),
  body('• 법인차량 예약: 차량별 일별·주별 예약 현황 조회 및 예약 생성·취소'),
  body('• 마이페이지: 프로필 수정, 비밀번호 변경, 권한 신청'),
  body('• 관리자 기능: 사용자·부서·권한·메뉴 통합 관리'),
  blank(),
  h2('1.2 권한 체계'),
  body('시스템은 3단계 권한으로 구분되며, 권한에 따라 접근 가능한 메뉴와 기능이 달라집니다.'),
  blank(),
  roleTable(),
  blank(),
  note('권한 상향이 필요한 경우 마이페이지 → 권한 신청 메뉴를 통해 신청하고, 시스템 관리자의 승인을 받아야 합니다.'),
  pageBreak(),
);

// ── 2. 로그인 / 로그아웃 ──────
add(
  h1('2. 로그인 / 로그아웃'),
  h2('2.1 로그인'),
  body('브라우저에서 시스템에 접속하면 로그인 페이지가 자동으로 표시됩니다.'),
  blank(),
  imgPara('01_login.png'),
  blank(),
  step(1, '이메일 주소를 입력합니다.'),
  step(2, '비밀번호를 입력합니다.'),
  step(3, '로그인 버튼을 클릭합니다.'),
  step(4, '로그인 성공 시 대시보드 화면으로 이동합니다.'),
  blank(),
  body('로그인 실패 시 아래와 같이 오류 메시지가 표시됩니다.'),
  imgPara('02_login_fail.png'),
  warn('이메일 또는 비밀번호가 올바르지 않으면 오류 메시지가 표시됩니다. 대소문자를 정확히 입력해 주세요.'),
  blank(),
  h2('2.2 로그아웃'),
  step(1, '화면 왼쪽 사이드바 하단의 로그아웃 버튼을 클릭합니다.'),
  step(2, '로그인 페이지로 이동하며 세션이 종료됩니다.'),
  note('보안을 위해 사용 후에는 반드시 로그아웃하세요.'),
  pageBreak(),
);

// ── 3. 대시보드 ───────────────
add(
  h1('3. 대시보드'),
  body('로그인 후 최초로 표시되는 메인 화면입니다. 사용자 이름과 역할이 상단에 표시되며, 주요 기능으로 바로 이동할 수 있는 퀵 메뉴가 제공됩니다.'),
  blank(),
  h2('3.1 관리자 대시보드'),
  imgPara('03_dashboard_admin.png'),
  body('시스템 관리자로 로그인하면 사용자 관리, 부서 관리, 권한 관리, 메뉴 관리 메뉴가 추가로 표시됩니다.'),
  blank(),
  h2('3.2 일반 사용자 대시보드'),
  imgPara('04_dashboard_user.png'),
  body('일반 사용자로 로그인하면 자산 관리, 회의실 예약, 법인차량 예약, 마이페이지 메뉴가 표시됩니다.'),
  pageBreak(),
);

// ── 4. 자산 관리 ──────────────
add(
  h1('4. 자산 관리'),
  body('회사 내 IT 자산(데스크탑, 노트북, 서버, 모니터)을 조회하고 관리합니다.'),
  blank(),
  h2('4.1 자산 목록 조회'),
  imgPara('05_asset_list.png'),
  step(1, '사이드바에서 자산 관리를 클릭합니다.'),
  step(2, '상단 탭(데스크탑 / 노트북 / 서버 / 모니터)에서 카테고리를 선택합니다.'),
  step(3, '검색 조건(자산관리번호, 사용자명, 상태)을 입력한 후 검색 버튼을 클릭합니다.'),
  step(4, '목록에서 원하는 자산 정보를 확인합니다.'),
  blank(),
  body('노트북 탭으로 전환한 화면:'),
  imgPara('07_asset_laptop.png'),
  note('모니터 탭에서는 OS·CPU·RAM 컬럼이 표시되지 않습니다.'),
  blank(),
  h2('4.2 자산 등록  [자산 관리자 이상]'),
  imgPara('06_asset_register.png'),
  step(1, '자산 등록 버튼을 클릭합니다.'),
  step(2, '등록 다이얼로그에서 항목을 입력합니다. (자산관리번호*, 사용자명* 필수 입력)'),
  step(3, '저장 버튼을 클릭하면 목록에 즉시 반영됩니다.'),
  blank(),
  h2('4.3 자산 수정  [자산 관리자 이상]'),
  step(1, '목록에서 수정할 자산 행의 ✏️ 아이콘을 클릭합니다.'),
  step(2, '수정 다이얼로그에서 항목을 변경합니다.'),
  step(3, '저장 버튼을 클릭합니다.'),
  blank(),
  h2('4.4 자산 삭제  [자산 관리자 이상]'),
  step(1, '목록에서 삭제할 자산 행의 🗑️ 아이콘을 클릭합니다.'),
  step(2, '확인 메시지에서 확인을 클릭하면 삭제됩니다.'),
  warn('여러 자산을 한꺼번에 삭제하려면 체크박스를 선택한 후 선택 삭제 버튼을 클릭하세요.'),
  blank(),
  h2('4.5 엑셀 일괄 업로드  [자산 관리자 이상]'),
  step(1, '템플릿 버튼을 클릭해 엑셀 양식을 다운로드합니다.'),
  step(2, '양식에 자산 정보를 입력하고 저장합니다.'),
  step(3, '일괄 업로드 버튼을 클릭하고 작성한 파일을 선택합니다.'),
  step(4, '업로드 버튼을 클릭하면 처리 결과(전체/성공/실패 건수)가 표시됩니다.'),
  blank(),
  h2('4.6 엑셀 다운로드  [자산 관리자 이상]'),
  body('엑셀 다운로드 버튼을 클릭하면 현재 카테고리의 전체 자산 목록이 .xlsx 파일로 저장됩니다.'),
  pageBreak(),
);

// ── 5. 회의실 예약 ─────────────
add(
  h1('5. 회의실 예약'),
  body('스케줄러 형태로 회의실 예약 현황을 확인하고 예약을 생성·취소할 수 있습니다.'),
  blank(),
  h2('5.1 예약 현황 조회 (일별)'),
  imgPara('08_meeting_room.png'),
  step(1, '사이드바에서 회의실 예약을 클릭합니다.'),
  step(2, '일별 / 주별 탭을 선택합니다.'),
  step(3, '날짜 이동 버튼(〈 〉)으로 원하는 날짜로 이동하거나 오늘 버튼으로 오늘 날짜로 돌아옵니다.'),
  step(4, '스케줄러 표에서 회의실별 예약 현황(시간대·예약자)을 확인합니다.'),
  note('세로축: 시간대(08:00~19:30, 30분 단위) / 가로축: 회의실별 칸 / 빈 칸: 예약 가능 슬롯'),
  blank(),
  h2('5.2 예약 생성'),
  imgPara('09_meeting_book.png'),
  step(1, '스케줄러에서 예약하려는 빈 시간 칸을 클릭합니다.'),
  step(2, '예약 다이얼로그에서 회의실, 회의 제목, 참석 인원, 시작·종료 시간을 입력합니다.'),
  step(3, '예약 버튼을 클릭하면 예약이 완료됩니다.'),
  note('예약 성공 시 "예약이 완료되었습니다." 메시지가 표시되고 스케줄러에 즉시 반영됩니다.'),
  blank(),
  h2('5.3 예약 취소'),
  step(1, '스케줄러에서 본인이 예약한 블록의 삭제(×) 버튼을 클릭합니다.'),
  step(2, '확인 후 예약이 취소됩니다.'),
  warn('타인의 예약은 취소할 수 없습니다. 시스템 관리자에게 문의하세요.'),
  pageBreak(),
);

// ── 6. 법인차량 예약 ───────────
add(
  h1('6. 법인차량 예약'),
  body('회사 보유 법인차량의 예약 현황을 조회하고 예약을 생성할 수 있습니다.'),
  blank(),
  h2('6.1 예약 현황 조회 (일별)'),
  imgPara('11_vehicle.png'),
  step(1, '사이드바에서 법인차량 예약을 클릭합니다.'),
  step(2, '일별 / 주별 탭을 선택합니다.'),
  step(3, '날짜 이동 버튼으로 원하는 날짜로 이동합니다.'),
  note('화면 상단에 차량별 색상 범례가 표시되어 여러 차량의 예약을 색상으로 구별할 수 있습니다.'),
  blank(),
  h2('6.2 주별 보기'),
  imgPara('13_vehicle_weekly.png'),
  blank(),
  h2('6.3 예약 생성'),
  imgPara('12_vehicle_book.png'),
  step(1, '예약하기 버튼을 클릭합니다.'),
  step(2, '예약 다이얼로그에서 차량, 예약일, 시작/종료 시간, 목적, 행선지를 입력합니다.'),
  step(3, '운전자는 로그인 사용자 이름으로 자동 입력됩니다.'),
  step(4, '저장 버튼을 클릭하면 예약이 완료됩니다.'),
  note('예약 성공 시 "예약이 완료되었습니다." 메시지가 표시됩니다.'),
  blank(),
  h2('6.4 예약 취소'),
  step(1, '스케줄러에서 본인이 예약한 블록의 삭제(×) 버튼을 클릭합니다.'),
  step(2, '확인 후 예약이 취소됩니다.'),
  pageBreak(),
);

// ── 7. 마이페이지 ──────────────
add(
  h1('7. 마이페이지'),
  body('내 계정 정보 수정, 비밀번호 변경, 권한 신청을 할 수 있습니다.'),
  blank(),
  h2('7.1 프로필 수정'),
  imgPara('14_mypage_profile.png'),
  step(1, '사이드바에서 마이페이지를 클릭합니다.'),
  step(2, '프로필 탭에서 이름, 부서 등 정보를 수정합니다.'),
  step(3, '저장 버튼을 클릭합니다.'),
  blank(),
  h2('7.2 비밀번호 변경'),
  imgPara('15_mypage_password.png'),
  step(1, '비밀번호 변경 탭을 클릭합니다.'),
  step(2, '현재 비밀번호, 새 비밀번호, 새 비밀번호 확인을 입력합니다.'),
  step(3, '변경 버튼을 클릭합니다.'),
  warn('새 비밀번호와 확인이 일치하지 않으면 변경되지 않습니다.'),
  blank(),
  h2('7.3 권한 신청'),
  imgPara('16_mypage_permission.png'),
  step(1, '권한 신청 탭을 클릭합니다.'),
  step(2, '권한 신청 버튼을 클릭합니다.'),
  step(3, '신청 역할(자산 관리자 또는 시스템 관리자)과 신청 사유를 입력합니다.'),
  step(4, '신청 버튼을 클릭합니다.'),
  step(5, '관리자 승인 후 권한이 변경됩니다. 신청 내역과 처리 상태를 탭에서 확인할 수 있습니다.'),
  pageBreak(),
);

// ── 8. 관리자 기능 ─────────────
add(
  h1('8. 관리자 기능'),
  note('이 장의 기능은 시스템 관리자(SYSTEM_ADMIN) 권한을 가진 사용자만 이용할 수 있습니다.'),
  blank(),
  h2('8.1 사용자 관리'),
  imgPara('17_user_mgmt.png'),
  step(1, '사이드바에서 사용자 관리를 클릭합니다.'),
  step(2, '이름·이메일·부서·역할 등으로 검색할 수 있습니다.'),
  step(3, '목록에서 ✏️ 버튼을 클릭하여 이름, 부서, 역할, 활성화 여부를 변경합니다.'),
  step(4, '🗑️ 버튼을 클릭하면 계정을 삭제합니다.'),
  warn('삭제된 계정은 복구할 수 없습니다. 신중하게 처리해 주세요.'),
  blank(),
  h2('8.2 부서 관리'),
  imgPara('18_dept_mgmt.png'),
  step(1, '사이드바에서 부서 관리를 클릭합니다.'),
  step(2, '부서 등록 버튼을 클릭하고 부서명을 입력하여 새 부서를 추가합니다.'),
  step(3, '목록에서 ✏️(수정) 또는 🗑️(삭제) 버튼으로 부서를 관리합니다.'),
  warn('소속 사용자가 있는 부서는 삭제되지 않을 수 있습니다.'),
  blank(),
  h2('8.3 권한 신청 관리'),
  imgPara('19_perm_mgmt.png'),
  step(1, '사이드바에서 권한 관리를 클릭합니다.'),
  step(2, '신청 목록에서 신청자·현재 역할·신청 역할·사유를 확인합니다.'),
  step(3, '승인 버튼을 클릭하면 즉시 해당 사용자의 역할이 변경됩니다.'),
  step(4, '거절 버튼을 클릭하면 역할 변경 없이 신청이 종료됩니다. 코멘트로 사유를 전달할 수 있습니다.'),
  blank(),
  h2('8.4 메뉴 관리'),
  imgPara('20_menu_mgmt.png'),
  step(1, '사이드바에서 메뉴 관리를 클릭합니다.'),
  step(2, '목록에서 수정할 메뉴의 ✏️ 버튼을 클릭합니다.'),
  step(3, '메뉴명, 경로, 표시 순서, 최소 권한, 노출 여부를 수정합니다.'),
  step(4, '저장 버튼을 클릭합니다.'),
  warn('메뉴 노출 여부를 끄면 해당 권한의 사용자에게 메뉴가 표시되지 않습니다. 주의해서 변경하세요.'),
  pageBreak(),
);

// ── 9. FAQ ───────────────────
add(
  h1('9. 자주 묻는 질문 (FAQ)'),
  blank(),
  h3('Q. 비밀번호를 잊었습니다.'),
  body('현재 비밀번호 찾기 기능은 지원되지 않습니다. 시스템 관리자에게 비밀번호 초기화를 요청해 주세요.'),
  blank(),
  h3('Q. 자산 등록 시 "이미 등록된 자산관리번호" 오류가 납니다.'),
  body('자산관리번호는 시스템 내에서 고유해야 합니다. 중복되지 않는 번호를 사용하거나 기존 자산을 먼저 삭제해 주세요.'),
  blank(),
  h3('Q. 회의실 예약이 되지 않습니다.'),
  body('선택한 시간대에 이미 예약이 있는 경우 예약할 수 없습니다. 스케줄러에서 빈 슬롯을 확인한 후 예약해 주세요.'),
  blank(),
  h3('Q. 권한 신청 후 언제 반영되나요?'),
  body('시스템 관리자가 승인하는 즉시 반영됩니다. 승인 여부는 마이페이지 → 권한 신청 탭에서 확인할 수 있습니다.'),
  blank(),
  h3('Q. 엑셀 업로드 후 일부 데이터가 실패했습니다.'),
  body('업로드 결과 다이얼로그에서 실패 행 번호와 사유를 확인할 수 있습니다. 오류를 수정한 후 해당 행만 다시 업로드하세요.'),
  blank(),
  h3('Q. 로그인 후 화면이 비어 있거나 메뉴가 보이지 않습니다.'),
  body('브라우저를 새로고침(F5)하거나 로그아웃 후 다시 로그인해 보세요. 문제가 지속되면 관리자에게 문의해 주세요.'),
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 문서 생성
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const doc = new Document({
  styles: {
    default: {
      document: { run: { font: 'Malgun Gothic', size: 22 } },
    },
    paragraphStyles: [
      {
        id: 'Heading1', name: 'Heading 1',
        basedOn: 'Normal', next: 'Normal',
        run: { size: 36, bold: true, color: '1A237E', font: 'Malgun Gothic' },
        paragraph: { spacing: { before: 400, after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '1976D2', space: 4 } } },
      },
      {
        id: 'Heading2', name: 'Heading 2',
        basedOn: 'Normal', next: 'Normal',
        run: { size: 28, bold: true, color: '1565C0', font: 'Malgun Gothic' },
        paragraph: { spacing: { before: 300, after: 150 } },
      },
      {
        id: 'Heading3', name: 'Heading 3',
        basedOn: 'Normal', next: 'Normal',
        run: { size: 24, bold: true, color: '0D47A1', font: 'Malgun Gothic' },
        paragraph: { spacing: { before: 200, after: 100 } },
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1.2), right: convertInchesToTwip(1.2) },
      },
    },
    children,
  }],
});

fs.mkdirSync(path.dirname(OUT), { recursive: true });
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(OUT, buf);
  console.log('✅ 문서 생성 완료:', OUT);
  console.log('   파일 크기:', (fs.statSync(OUT).size / 1024).toFixed(1), 'KB');
});

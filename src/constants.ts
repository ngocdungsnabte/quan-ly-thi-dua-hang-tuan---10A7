import { Student, Criteria } from './types';

export const DEFAULT_STUDENTS: Student[] = [
  { id: 1, name: "Văn Thế", group: 1 }, { id: 2, name: "Kim Ngân", group: 1 }, { id: 3, name: "Huỳnh Như", group: 1 },
  { id: 4, name: "Nhã Phương", group: 1 }, { id: 5, name: "Bảo Trâm", group: 1 }, { id: 6, name: "Hoàng Anh", group: 1 },
  { id: 7, name: "Bảo Nhi", group: 1 }, { id: 8, name: "Thanh Trà", group: 1 }, { id: 9, name: "Đức Thịnh", group: 1 },
  { id: 10, name: "Ngọc Thảo", group: 1 },
  { id: 11, name: "Hiếu Kỳ", group: 2 }, { id: 12, name: "Thu Thảo", group: 2 }, { id: 13, name: "Hải Đăng", group: 2 },
  { id: 14, name: "Hải Khang", group: 2 }, { id: 15, name: "Yến Nhi", group: 2 }, { id: 16, name: "Như Ngọc", group: 2 },
  { id: 17, name: "Yến Phương", group: 2 }, { id: 18, name: "Quốc Hùng", group: 2 }, { id: 19, name: "Kim Muội", group: 2 },
  { id: 20, name: "Ngọc Phụng", group: 2 }, { id: 21, name: "Văn Khánh", group: 2 }, { id: 22, name: "Phương Quỳnh", group: 2 },
  { id: 23, name: "Tấn Lộc", group: 3 }, { id: 24, name: "Trí Thiện", group: 3 }, { id: 25, name: "Trường Đông", group: 3 },
  { id: 26, name: "Nguyễn Nhựt", group: 3 }, { id: 27, name: "Thư Kỳ", group: 3 }, { id: 28, name: "Thanh Tiền", group: 3 },
  { id: 29, name: "Hữu Lượng", group: 3 }, { id: 30, name: "Nhựt Nam", group: 3 }, { id: 31, name: "Duy Tân", group: 3 },
  { id: 32, name: "Minh Đạt", group: 3 }, { id: 101, name: "Quỳnh Như", group: 3 }, { id: 102, name: "Như Huỳnh", group: 3 },
  { id: 33, name: "Minh Thiện", group: 4 }, { id: 34, name: "Bảo Ngọc", group: 4 }, { id: 35, name: "Thanh Ngân", group: 4 },
  { id: 36, name: "Nhật Trường", group: 4 }, { id: 37, name: "Ngọc Hân", group: 4 }, { id: 38, name: "Thu Nhi", group: 4 },
  { id: 39, name: "Minh Khang", group: 4 }, { id: 40, name: "Lê Nhựt", group: 4 }, { id: 41, name: "Nhựt Đăng", group: 4 },
  { id: 42, name: "Hoài Hương", group: 4 }
];

export const CRITERIA: { plus: Criteria[]; minus: Criteria[] } = {
  minus: [
    { id: 'm1', name: "Đi muộn", score: 1 },
    { id: 'm2', name: "Bỏ tiết/Vắng không phép", score: 4 },
    { id: 'm3', name: "Không chuẩn bị bài", score: 2 },
    { id: 'm4', name: "Điểm kém (< 5.0)", score: 3 },
    { id: 'm5', name: "Thái độ sai/Mất trật tự", score: 2 },
    { id: 'm6', name: "Phê bình nhẹ", score: 3 },
    { id: 'm7', name: "Phê bình nặng", score: 5 }
  ],
  plus: [
    { id: 'p1', name: "Phát biểu xây dựng bài", score: 1 },
    { id: 'p2', name: "Điểm tốt (>= 9.0)", score: 5 },
    { id: 'p3', name: "Điểm khá (8.0 ≤ điểm < 9.0)", score: 3 },
    { id: 'p4', name: "Việc tốt giúp bạn/lớp", score: 5 },
    { id: 'p5', name: "Được khen ngợi", score: 5 }
  ]
};

export const CLASS_BASE_POINTS = 40;
export const GROUP_BASE_POINTS = 0;
export const MAX_WEEKS = 37;

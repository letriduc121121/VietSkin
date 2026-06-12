# Thư mục ảnh — VietSkin Frontend

## Cấu trúc

```
images/
├── hero/          Ảnh banner trang chủ (hero section)
│   └── banner.jpg     Ảnh chính hero (khuyến nghị: 1600×900px, landscape)
│
├── doctors/       Ảnh chân dung bác sĩ
│   ├── dr-nguyen-van-a.jpg    BS. Nguyễn Văn A  (400×500px, portrait)
│   └── dr-tran-thi-b.jpg     BS. Trần Thị B    (400×500px, portrait)
│
├── services/      Ảnh minh họa dịch vụ
│   ├── acne.jpg           Điều trị mụn        (800×600px)
│   ├── rejuvenation.jpg   Trẻ hóa da          (800×600px)
│   ├── pigment.jpg        Nám & tàn nhang     (800×600px)
│   └── cosmetic.jpg       Thẩm mỹ nội khoa   (800×600px)
│
└── clinic/        Ảnh phòng khám, nội thất
    ├── exterior.jpg   Mặt tiền phòng khám   (1200×800px)
    ├── reception.jpg  Khu vực lễ tân        (1200×800px)
    └── room.jpg       Phòng khám            (1200×800px)
```

## Cách dùng trong code

```tsx
import heroBanner from '../assets/images/hero/banner.jpg';
import drA from '../assets/images/doctors/dr-nguyen-van-a.jpg';

<img src={heroBanner} alt="VietSkin Clinic" />
<img src={drA} alt="BS. Nguyễn Văn A" />
```

## Ghi chú

- Định dạng khuyến nghị: `.jpg` cho ảnh chụp, `.png` cho logo/icon
- Nén ảnh trước khi import (dùng TinyPNG hoặc Squoosh)
- Đặt tên file không dấu, dùng dấu gạch ngang

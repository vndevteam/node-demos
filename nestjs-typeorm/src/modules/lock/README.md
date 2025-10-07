# Advisory Lock Demo - CloudSign Simulation

Đây là demo NestJS sử dụng PostgreSQL Advisory Lock để tránh xung đột khi gọi CloudSign API đồng thời với cùng một document ID.

## Tổng quan

Demo này triển khai một endpoint `POST /sign/:id` mô phỏng việc gọi CloudSign API mất ~8 giây. Sử dụng PostgreSQL advisory lock để đảm bảo chỉ có một request cùng lúc cho mỗi document ID.

## Cấu trúc Files

```text
src/modules/lock/
├── lock.controller.ts    # REST API endpoints
├── lock.service.ts       # Business logic và advisory lock handling
├── lock.module.ts        # NestJS module definition
├── lock.util.ts          # Utility functions
└── README.md            # Hướng dẫn này
```

## API Endpoints

### 1. Sign Document

```bash
POST /sign/:id
```

**Mô tả**: Bắt đầu quá trình ký tài liệu. Giữ advisory lock trong ~8 giây để mô phỏng CloudSign API.

**Response Success (200)**:

```json
{
  "success": true,
  "message": "Sign request completed successfully for id=abc",
  "data": {
    "signId": "abc",
    "status": "completed",
    "duration": "8001ms",
    "timestamp": "2025-10-07T10:30:45.123Z"
  }
}
```

**Response Conflict (409)**:

```json
{
  "message": "Already in progress for id=abc",
  "error": "Conflict",
  "statusCode": 409
}
```

### 2. Check Sign Status

```bash
GET /sign/:id/status
```

**Mô tả**: Kiểm tra xem có process signing nào đang chạy cho document ID này không.

**Response**:

```json
{
  "id": "abc",
  "inProgress": true,
  "status": "signing"
}
```

## Cách Test

### Prerequisites

1. Đảm bảo PostgreSQL đang chạy và kết nối được cấu hình đúng
2. Start NestJS app:

```bash
cd nestjs-typeorm
pnpm start:dev
```

### Test Scenario 1: Normal Flow

```bash
# Request bình thường - sẽ thành công sau ~8s
curl -X POST http://localhost:3000/sign/document-123 -i
```

### Test Scenario 2: Concurrent Conflict

Mở 2 terminal và chạy đồng thời:

```bash
# Terminal A - sẽ thành công sau ~8s
curl -X POST http://localhost:3000/sign/document-456 -i

# Terminal B - chạy ngay trong vòng 8s - sẽ nhận 409 Conflict
curl -X POST http://localhost:3000/sign/document-456 -i
```

### Test Scenario 3: Check Status

```bash
# Kiểm tra status trước khi sign
curl http://localhost:3000/sign/document-789/status

# Bắt đầu signing process
curl -X POST http://localhost:3000/sign/document-789 &

# Kiểm tra status trong khi đang signing (trong vòng 8s)
curl http://localhost:3000/sign/document-789/status
```

### Test Scenario 4: Different IDs (Parallel)

```bash
# Hai request khác ID - chạy song song được
curl -X POST http://localhost:3000/sign/doc-A &
curl -X POST http://localhost:3000/sign/doc-B &
```

## Cách hoạt động

1. **Advisory Lock**: Sử dụng `pg_try_advisory_lock(hashtext(namespace), hashtext(id))` để tạo lock duy nhất cho mỗi document ID
2. **Non-blocking**: `pg_try_advisory_lock` trả về ngay lập tức với `true/false` thay vì chờ
3. **Session-based**: Lock được giữ trong session và tự động giải phóng khi session đóng
4. **Manual unlock**: Sử dụng `pg_advisory_unlock()` để giải phóng lock một cách chủ động

## Technical Details

### Lock Namespace

- Namespace: `cloudsign:requestSignContract`
- Key: Document ID được truyền vào

### Lock Duration

- Mô phỏng: 8 giây (có thể điều chỉnh trong `lock.service.ts`)
- Thực tế: Thời gian thực của CloudSign API call

### Error Handling

- Connection errors được log và handle gracefully
- Lock luôn được giải phóng trong `finally` block
- QueryRunner được release đúng cách

## Monitoring & Logging

Service ghi log các sự kiện quan trọng:

- Lock acquisition attempts
- Lock success/failure
- Process start/completion
- Lock release status
- Errors và warnings

Example logs:

```bash
[LockService] Attempting to acquire lock for id=abc
[LockService] Successfully acquired lock for id=abc. Starting CloudSign simulation...
[LockService] CloudSign simulation completed for id=abc after 8001ms
[LockService] Successfully released lock for id=abc
```

## Mở rộng

Để adapt cho production:

1. **Thay thế simulation bằng CloudSign API call thật**
2. **Thêm database transaction để cập nhật status**
3. **Implement retry logic cho lock acquisition**
4. **Thêm metrics và monitoring**
5. **Cấu hình timeout parameters**

# Bruno API Collection - Advisory Lock Demo

Đây là bộ Bruno API collection để test advisory lock demo trong NestJS TypeORM project.

- [Bruno API Collection - Advisory Lock Demo](#bruno-api-collection---advisory-lock-demo)
  - [Cài đặt và sử dụng](#cài-đặt-và-sử-dụng)
    - [1. Cài đặt Bruno](#1-cài-đặt-bruno)
    - [2. Mở collection](#2-mở-collection)
    - [3. Cấu hình Environment](#3-cấu-hình-environment)
  - [Test Scenarios](#test-scenarios)
    - [Scenario 1: Basic Flow (Sequential)](#scenario-1-basic-flow-sequential)
    - [Scenario 2: Conflict Test (Manual Timing)](#scenario-2-conflict-test-manual-timing)
    - [Scenario 3: Parallel Processing](#scenario-3-parallel-processing)
  - [Available Bruno Requests](#available-bruno-requests)
  - [Test Details](#test-details)
    - [Request Headers](#request-headers)
    - [Expected Responses](#expected-responses)
  - [Advanced Testing](#advanced-testing)
    - [Using Bruno CLI](#using-bruno-cli)
    - [Custom Variables](#custom-variables)
  - [Test Automation Ideas](#test-automation-ideas)
    - [Timing-based Tests](#timing-based-tests)
    - [Load Testing](#load-testing)
  - [Notes](#notes)
  - [Troubleshooting](#troubleshooting)

## Cài đặt và sử dụng

### 1. Cài đặt Bruno

```bash
# macOS
brew install bruno-cli

# hoặc tải GUI version từ https://www.usebruno.com/
```

### 2. Mở collection

- Mở Bruno GUI
- Import collection từ thư mục: `test/nestjs-typeorm-bruno`
- Chọn folder `advisory-lock` để xem các API requests
- Hoặc sử dụng CLI: `bru run --env local --folder "advisory-lock"`

### 3. Cấu hình Environment

File `environments/local.bru` chứa các biến:

- `baseUrl`: <http://localhost:3000>
- `documentId`: test-document-123
- `conflictId`: conflict-test-456

## Test Scenarios

### Scenario 1: Basic Flow (Sequential)

Chạy theo thứ tự:

1. **01. Check Document Status (Before Signing)** - Kiểm tra status trước khi sign
2. **02. Sign Document (Normal Flow)** - Ký tài liệu bình thường (~8s)
3. **03. Check Status After** - Kiểm tra status sau khi hoàn thành

### Scenario 2: Conflict Test (Manual Timing)

1. **04. Sign Document (Conflict Test - First Request)** - Bắt đầu request đầu tiên
2. **05. Sign Document (Conflict Test - Second Request)** - Chạy ngay lập tức (trong 8s) → Expect 409
3. **06. Check Status During Signing** - Kiểm tra status trong lúc đang ký

### Scenario 3: Parallel Processing

Chạy đồng thời:

1. **07. Parallel Requests - Document A**
2. **08. Parallel Requests - Document B**

→ Cả hai sẽ thành công vì khác document ID

## Available Bruno Requests

Các file request trong thư mục `advisory-lock/` (theo thứ tự sequence):

1. `check-status-before.bru` - **01. Check Document Status (Before Signing)**
2. `sign-document-normal.bru` - **02. Sign Document (Normal Flow)**
3. `checks-status-after.bru` - **03. Check Status After Signing**
4. `conflict-first-request.bru` - **04. Sign Document (Conflict Test - First Request)**
5. `conflict-second-request.bru` - **05. Sign Document (Conflict Test - Second Request)**
6. `check-status-during-signing.bru` - **06. Check Status During Signing**
7. `parallel-doc-a.bru` - **07. Parallel Requests - Document A**
8. `parallel-doc-b.bru` - **08. Parallel Requests - Document B**
9. `folder.bru` - Metadata cho folder advisory-lock

## Test Details

### Request Headers

Tất cả requests sử dụng:

- Method: GET/POST
- Content-Type: application/json (tự động)
- No authentication required

### Expected Responses

**Success Response (200)**:

```json
{
  "success": true,
  "message": "Sign request completed successfully for id=test-document-123",
  "data": {
    "signId": "test-document-123",
    "status": "completed",
    "duration": "8001ms",
    "timestamp": "2025-10-07T10:30:45.123Z"
  }
}
```

**Conflict Response (409)**:

```json
{
  "message": "Already in progress for id=conflict-test-456",
  "error": "Conflict",
  "statusCode": 409
}
```

**Status Response**:

```json
{
  "id": "test-document-123",
  "inProgress": false,
  "status": "available"
}
```

## Advanced Testing

### Using Bruno CLI

```bash
# Run all tests
bru run --env local

# Run specific folder
bru run --env local --folder "advisory-lock"

# Run with output
bru run --env local --output results.json
```

### Custom Variables

Trong Bruno, bạn có thể tạo biến động:

```javascript
// Pre-request script
bru.setVar('dynamicId', 'doc-' + Date.now());
```

## Test Automation Ideas

### Timing-based Tests

Để test conflict behavior chính xác, có thể:

1. **Sử dụng Bruno với Pre-request Scripts**:

```javascript
// Start background request
setTimeout(() => {
  // Second request logic
}, 100);
```

2. **Sử dụng External Script**:

```bash
# Terminal 1
curl -X POST http://localhost:3000/sign/timing-test &

# Terminal 2 (ngay lập tức)
curl -X POST http://localhost:3000/sign/timing-test
```

### Load Testing

```bash
# Concurrent requests với artillery hoặc k6
artillery quick --count 10 --num 2 http://localhost:3000/sign/load-test
```

## Notes

- **Timing Sensitivity**: Conflict tests cần chạy trong khoảng thời gian 8s
- **Database Connection**: Đảm bảo PostgreSQL đang chạy
- **Server Status**: NestJS app phải chạy trên port 3000
- **Lock Cleanup**: Locks tự động được giải phóng khi connection đóng

## Troubleshooting

**Connection Refused**:

- Kiểm tra NestJS app đang chạy: `pnpm start:dev`
- Verify port 3000: `netstat -tulpn | grep :3000`

**Test Failures**:

- Check server logs cho error details
- Verify PostgreSQL connection
- Ensure environment variables đúng

**Timing Issues trong Conflict Tests**:

- Manual timing là khó khăn trong GUI
- Recommend sử dụng script automation hoặc multiple terminals

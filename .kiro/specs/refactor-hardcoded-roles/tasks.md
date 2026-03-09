# Tasks: Refactor Hardcoded Roles

## Task List

- [ ] 1. Phase 1: Refactor Controllers
  - [ ] 1.1 Refactor AuthController.cs
  - [ ] 1.2 Refactor AdminPaymentsController.cs
  - [ ] 1.3 Refactor AdminDebtsController.cs
  - [ ] 1.4 Refactor AnnouncementsController.cs
  - [ ] 1.5 Refactor ExpensesController.cs
  - [ ] 1.6 Refactor IncidentsController.cs
  - [ ] 1.7 Refactor NotificationsController.cs
  - [ ] 1.8 Refactor OwnersController.cs
  - [ ] 1.9 Refactor DebtsController.cs
  - [ ] 1.10 Refactor PollsController.cs
  - [ ] 1.11 Verify all controllers compile

- [ ] 2. Phase 2: Refactor Services
  - [ ] 2.1 Refactor NotificationService.cs
  - [ ] 2.2 Verify service compiles

- [ ] 3. Phase 3: Refactor Attributes
  - [ ] 3.1 Refactor OwnerAuthorizeAttribute.cs
  - [ ] 3.2 Verify attribute compiles

- [ ] 4. Phase 4: Refactor DTOs
  - [ ] 4.1 Refactor AuthDtos.cs (update regex pattern)
  - [ ] 4.2 Verify DTO compiles

- [ ] 5. Phase 5: Refactor Hubs
  - [x] 5.1 Refactor NotificationHub.cs
  - [ ] 5.2 Verify hub compiles

- [ ] 6. Phase 6: Refactor Configuration
  - [ ] 6.1 Refactor Program.cs (role initialization)
  - [ ] 6.2 Verify Program.cs compiles

- [ ] 7. Phase 7: Refactor Tests
  - [ ] 7.1 Refactor AuthControllerUnitTests.cs
  - [ ] 7.2 Run unit tests and verify all pass

- [ ] 8. Final Verification
  - [ ] 8.1 Build entire solution
  - [ ] 8.2 Run all tests
  - [ ] 8.3 Grep search for remaining hardcoded strings
  - [ ] 8.4 Code review checklist

---

## Task Details

### 1.1 Refactor AuthController.cs

**File**: `backend-services/src/CondoFlow.WebApi/Controllers/AuthController.cs`

**Changes Required**:
1. Add import: `using CondoFlow.Domain.Enums;`
2. Replace all occurrences:
   - Line 101: `role = roles.FirstOrDefault() ?? "Owner"` → `UserRoles.Owner`
   - Line 120: `var allowedRoles = new[] { "Owner", "Admin" }` → `UserRoles.Owner, UserRoles.Admin`
   - Line 151: `IsApproved = request.Role == "Admin"` → `UserRoles.Admin`
   - Line 161: `if (request.Role == "Owner")` → `UserRoles.Owner`
   - Line 175: `if (request.Role == "Owner" && !user.IsApproved)` → `UserRoles.Owner`
   - Line 230: `[Authorize(Roles = "Admin")]` → `UserRoles.Admin`
   - Line 247: `if (roles.Contains("Owner"))` → `UserRoles.Owner`
   - Line 291: `[Authorize(Roles = "Admin")]` → `UserRoles.Admin`
   - Line 331: `[Authorize(Roles = "Admin")]` → `UserRoles.Admin`
   - Line 339: `[Authorize(Roles = "Admin")]` → `UserRoles.Admin`
   - Line 347: `[Authorize(Roles = "Admin")]` → `UserRoles.Admin`

**Verification**: Compile and ensure no errors

---

### 1.2 Refactor AdminPaymentsController.cs

**File**: `backend-services/src/CondoFlow.WebApi/Controllers/AdminPaymentsController.cs`

**Changes Required**:
1. Add import: `using CondoFlow.Domain.Enums;`
2. Replace:
   - Line 16: `[Authorize(Roles = "Admin")]` → `UserRoles.Admin`

**Verification**: Compile and ensure no errors

---

### 1.3 Refactor AdminDebtsController.cs

**File**: `backend-services/src/CondoFlow.WebApi/Controllers/AdminDebtsController.cs`

**Changes Required**:
1. Add import: `using CondoFlow.Domain.Enums;`
2. Replace:
   - Line 9: `[Authorize(Roles = "Admin")]` → `UserRoles.Admin`

**Verification**: Compile and ensure no errors

---

### 1.4 Refactor AnnouncementsController.cs

**File**: `backend-services/src/CondoFlow.WebApi/Controllers/AnnouncementsController.cs`

**Changes Required**:
1. Add import: `using CondoFlow.Domain.Enums;`
2. Replace:
   - Line 33: `[Authorize(Roles = "Admin")]` → `UserRoles.Admin`
   - Line 49: `[Authorize(Roles = "Admin")]` → `UserRoles.Admin`
   - Line 70: `[Authorize(Roles = "Admin")]` → `UserRoles.Admin`
   - Line 81: `[Authorize(Roles = "Admin")]` → `UserRoles.Admin`

**Verification**: Compile and ensure no errors

---

### 1.5 Refactor ExpensesController.cs

**File**: `backend-services/src/CondoFlow.WebApi/Controllers/ExpensesController.cs`

**Changes Required**:
1. Add import: `using CondoFlow.Domain.Enums;`
2. Replace:
   - Line 42: `[Authorize(Roles = "Admin")]` → `UserRoles.Admin`
   - Line 60: `[Authorize(Roles = "Admin")]` → `UserRoles.Admin`
   - Line 83: `[Authorize(Roles = "Admin")]` → `UserRoles.Admin`

**Verification**: Compile and ensure no errors

---

### 1.6 Refactor IncidentsController.cs

**File**: `backend-services/src/CondoFlow.WebApi/Controllers/IncidentsController.cs`

**Changes Required**:
1. Add import: `using CondoFlow.Domain.Enums;`
2. Replace:
   - Line 72: `[Authorize(Roles = "Admin")]` → `UserRoles.Admin`
   - Line 80: `[Authorize(Roles = "Admin")]` → `UserRoles.Admin`
   - Line 116: `var isAdmin = User.IsInRole("Admin")` → `UserRoles.Admin`

**Verification**: Compile and ensure no errors

---

### 1.7 Refactor NotificationsController.cs

**File**: `backend-services/src/CondoFlow.WebApi/Controllers/NotificationsController.cs`

**Changes Required**:
1. Add import: `using CondoFlow.Domain.Enums;`
2. Replace:
   - Line 33: `var isAdmin = userRoles.Contains("Admin")` → `UserRoles.Admin`
   - Line 68: `var isAdmin = userRoles.Contains("Admin")` → `UserRoles.Admin`

**Verification**: Compile and ensure no errors

---

### 1.8 Refactor OwnersController.cs

**File**: `backend-services/src/CondoFlow.WebApi/Controllers/OwnersController.cs`

**Changes Required**:
1. Add import: `using CondoFlow.Domain.Enums;`
2. Replace:
   - Line 37: `[Authorize(Roles = "Admin")]` → `UserRoles.Admin`

**Verification**: Compile and ensure no errors

---

### 1.9 Refactor DebtsController.cs

**File**: `backend-services/src/CondoFlow.WebApi/Controllers/DebtsController.cs`

**Changes Required**:
1. Add import: `using CondoFlow.Domain.Enums;`
2. Replace:
   - Line 39: `[Authorize(Roles = "Admin")]` → `UserRoles.Admin`

**Verification**: Compile and ensure no errors

---

### 1.10 Refactor PollsController.cs

**File**: `backend-services/src/CondoFlow.WebApi/Controllers/PollsController.cs`

**Changes Required**:
1. Add import: `using CondoFlow.Domain.Enums;`
2. Replace:
   - Line 48: `[Authorize(Roles = "Admin")]` → `UserRoles.Admin`
   - Line 66: `[Authorize(Roles = "Admin")]` → `UserRoles.Admin`
   - Line 164: `[Authorize(Roles = "Admin")]` → `UserRoles.Admin`

**Verification**: Compile and ensure no errors

---

### 1.11 Verify all controllers compile

**Action**: Run `dotnet build` on the WebApi project

**Expected Result**: No compilation errors

---

### 2.1 Refactor NotificationService.cs

**File**: `backend-services/src/CondoFlow.WebApi/Services/NotificationService.cs`

**Changes Required**:
1. Add import: `using CondoFlow.Domain.Enums;`
2. Replace:
   - Line 28: `"Admin"` → `UserRoles.Admin`
   - Line 52: `"Admin"` → `UserRoles.Admin`
   - Line 344: `"Admin"` → `UserRoles.Admin`

**Verification**: Compile and ensure no errors

---

### 2.2 Verify service compiles

**Action**: Run `dotnet build` on the WebApi project

**Expected Result**: No compilation errors

---

### 3.1 Refactor OwnerAuthorizeAttribute.cs

**File**: `backend-services/src/CondoFlow.WebApi/Attributes/OwnerAuthorizeAttribute.cs`

**Changes Required**:
1. Add import: `using CondoFlow.Domain.Enums;`
2. Replace:
   - Line 21: `if (user.IsInRole("Admin"))` → `UserRoles.Admin`
   - Line 27: `if (user.IsInRole("Owner"))` → `UserRoles.Owner`

**Verification**: Compile and ensure no errors

---

### 3.2 Verify attribute compiles

**Action**: Run `dotnet build` on the WebApi project

**Expected Result**: No compilation errors

---

### 4.1 Refactor AuthDtos.cs (update regex pattern)

**File**: `backend-services/src/CondoFlow.WebApi/DTOs/AuthDtos.cs`

**Changes Required**:
1. Add import: `using CondoFlow.Domain.Enums;`
2. Replace:
   - Line 17: `[Required, RegularExpression("^(Owner|Admin)$")]` → 
     `[Required, RegularExpression($"^({UserRoles.Owner}|{UserRoles.Admin})$")]`

**Note**: Use string interpolation to build the regex pattern from constants

**Verification**: Compile and test DTO validation

---

### 4.2 Verify DTO compiles

**Action**: Run `dotnet build` on the WebApi project

**Expected Result**: No compilation errors

---

### 5.1 Refactor NotificationHub.cs

**File**: `backend-services/src/CondoFlow.WebApi/Hubs/NotificationHub.cs`

**Changes Required**:
1. Add import: `using CondoFlow.Domain.Enums;`
2. Replace:
   - Line 16: `if (Context.User?.IsInRole("Admin") == true)` → `UserRoles.Admin`
   - Line 24: `if (Context.User?.IsInRole("Admin") == true)` → `UserRoles.Admin`

**Verification**: Compile and ensure no errors

---

### 5.2 Verify hub compiles

**Action**: Run `dotnet build` on the WebApi project

**Expected Result**: No compilation errors

---

### 6.1 Refactor Program.cs (role initialization)

**File**: `backend-services/src/CondoFlow.WebApi/Program.cs`

**Changes Required**:
1. Add import: `using CondoFlow.Domain.Enums;`
2. Replace:
   - Line 203: `if (!await roleManager.RoleExistsAsync("Admin"))` → `UserRoles.Admin`
   - Line 205: `await roleManager.CreateAsync(new IdentityRole("Admin"))` → `UserRoles.Admin`
   - Line 210: `if (!await roleManager.RoleExistsAsync("Owner"))` → `UserRoles.Owner`
   - Line 212: `await roleManager.CreateAsync(new IdentityRole("Owner"))` → `UserRoles.Owner`

**Verification**: Compile and ensure no errors

---

### 6.2 Verify Program.cs compiles

**Action**: Run `dotnet build` on the WebApi project

**Expected Result**: No compilation errors

---

### 7.1 Refactor AuthControllerUnitTests.cs

**File**: `backend-services/tests/CondoFlow.WebApi.Tests/AuthControllerUnitTests.cs`

**Changes Required**:
1. Add import: `using CondoFlow.Domain.Enums;`
2. Replace all occurrences:
   - Line 19: `"Admin"` → `UserRoles.Admin`
   - Line 38: `"Admin"` → `UserRoles.Admin`
   - Line 46: `Assert.Equal("Admin", request.Role)` → `UserRoles.Admin`
   - Line 61: `[InlineData("Owner", true)]` → `UserRoles.Owner`
   - Line 62: `[InlineData("Admin", true)]` → `UserRoles.Admin`
   - Line 67: `var allowedRoles = new[] { "Owner", "Admin" }` → `UserRoles.Owner, UserRoles.Admin`

**Verification**: Run tests and ensure all pass

---

### 7.2 Run unit tests and verify all pass

**Action**: Run `dotnet test` on the test project

**Expected Result**: All tests pass with no failures

---

### 8.1 Build entire solution

**Action**: Run `dotnet build` on the solution file

**Command**: 
```bash
cd backend-services
dotnet build CondoFlow.sln
```

**Expected Result**: Build succeeds with 0 errors

---

### 8.2 Run all tests

**Action**: Run all tests in the solution

**Command**:
```bash
cd backend-services
dotnet test CondoFlow.sln
```

**Expected Result**: All tests pass

---

### 8.3 Grep search for remaining hardcoded strings

**Action**: Search for any remaining hardcoded role strings

**Commands**:
```bash
# Search for "Admin" in role contexts
grep -r '"Admin"' --include="*.cs" backend-services/src/CondoFlow.WebApi/
grep -r '"Admin"' --include="*.cs" backend-services/src/CondoFlow.Application/

# Search for "Owner" in role contexts
grep -r '"Owner"' --include="*.cs" backend-services/src/CondoFlow.WebApi/
grep -r '"Owner"' --include="*.cs" backend-services/src/CondoFlow.Application/
```

**Expected Result**: Zero results (except in comments or unrelated contexts)

---

### 8.4 Code review checklist

**Review Items**:
- [ ] All hardcoded "Admin" strings replaced with `UserRoles.Admin`
- [ ] All hardcoded "Owner" strings replaced with `UserRoles.Owner`
- [ ] All modified files have `using CondoFlow.Domain.Enums;` import
- [ ] Solution compiles without errors
- [ ] All tests pass
- [ ] No new hardcoded strings introduced
- [ ] Code follows project naming conventions
- [ ] Changes are consistent across all files
- [ ] Authorize attributes use enum constants correctly
- [ ] Role checks in logic use enum constants correctly
- [ ] DTOs regex pattern uses string interpolation correctly
- [ ] Program.cs role initialization uses enum constants

**Expected Result**: All checklist items verified

---

## Completion Criteria

All tasks must be completed and verified before considering this refactoring done:

1. ✅ All 17 files refactored
2. ✅ Solution builds successfully
3. ✅ All tests pass
4. ✅ No hardcoded role strings remain
5. ✅ Code review approved

## Notes

- Work through tasks sequentially to catch compilation errors early
- Test after each phase to ensure no breaking changes
- Use git commits after each phase for easy rollback if needed
- Keep the changes minimal and focused on string replacement only

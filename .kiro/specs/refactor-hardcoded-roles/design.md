# Design Document: Refactor Hardcoded Roles

## Overview

This document outlines the design for systematically replacing all hardcoded role strings with the `UserRoles` enum constants throughout the CondoFlow backend codebase.

## Architecture Alignment

This refactoring aligns with the project's Clean Architecture principles:

- **Domain Layer**: The `UserRoles` enum lives in `Domain/Enums/`, making it accessible to all layers
- **DRY Principle**: Eliminates duplication of role strings across the codebase
- **Type Safety**: Provides compile-time checking for role references
- **Maintainability**: Centralizes role definitions in one location

## Design Decisions

### 1. Use `const string` in Static Class

**Decision**: Use a static class with `const string` fields instead of an enum type.

**Rationale**:
- `[Authorize(Roles = "...")]` attribute requires compile-time constants
- `const string` values can be used directly in attributes
- Maintains backward compatibility with existing string-based role checks
- Provides IntelliSense support

**Implementation**:
```csharp
public static class UserRoles
{
    public const string Admin = "Admin";
    public const string Owner = "Owner";
}
```

### 2. Systematic File-by-File Refactoring

**Decision**: Refactor files in order of dependency (Domain → Infrastructure → Application → WebApi).

**Rationale**:
- Ensures no compilation errors during refactoring
- Allows testing at each stage
- Follows the dependency flow of Clean Architecture

### 3. Preserve Existing Behavior

**Decision**: This is a pure refactoring with zero functional changes.

**Rationale**:
- Reduces risk of introducing bugs
- Allows for easier code review
- Maintains existing test coverage

## Implementation Strategy

### Phase 1: Controllers (WebApi Layer)

**Files to Modify**: 11 controller files

**Pattern 1: Authorize Attributes**
```csharp
// Before
[Authorize(Roles = "Admin")]

// After
[Authorize(Roles = UserRoles.Admin)]
```

**Pattern 2: Role Checks in Logic**
```csharp
// Before
if (User.IsInRole("Admin"))

// After
if (User.IsInRole(UserRoles.Admin))
```

**Pattern 3: Role Arrays**
```csharp
// Before
var allowedRoles = new[] { "Owner", "Admin" };

// After
var allowedRoles = new[] { UserRoles.Owner, UserRoles.Admin };
```

**Pattern 4: Role Comparisons**
```csharp
// Before
if (request.Role == "Admin")

// After
if (request.Role == UserRoles.Admin)
```

**Pattern 5: Role in Anonymous Objects**
```csharp
// Before
role = roles.FirstOrDefault() ?? "Owner"

// After
role = roles.FirstOrDefault() ?? UserRoles.Owner
```

**Pattern 6: Role in Contains Checks**
```csharp
// Before
if (roles.Contains("Owner"))

// After
if (roles.Contains(UserRoles.Owner))
```

### Phase 2: Services (WebApi Layer)

**File**: `NotificationService.cs`

**Pattern**: Role strings in method parameters
```csharp
// Before
await SendNotificationToRoleAsync(
    "Admin",
    message,
    type
);

// After
await SendNotificationToRoleAsync(
    UserRoles.Admin,
    message,
    type
);
```

### Phase 3: Attributes (WebApi Layer)

**File**: `OwnerAuthorizeAttribute.cs`

**Pattern**: Role checks in authorization logic
```csharp
// Before
if (user.IsInRole("Admin"))
if (user.IsInRole("Owner"))

// After
if (user.IsInRole(UserRoles.Admin))
if (user.IsInRole(UserRoles.Owner))
```

### Phase 4: DTOs (WebApi Layer)

**File**: `AuthDtos.cs`

**Pattern**: Regex validation with role names
```csharp
// Before
[RegularExpression("^(Owner|Admin)$")]

// After
[RegularExpression($"^({UserRoles.Owner}|{UserRoles.Admin})$")]
```

### Phase 5: Hubs (WebApi Layer)

**File**: `NotificationHub.cs`

**Pattern**: Role checks for SignalR groups
```csharp
// Before
if (Context.User?.IsInRole("Admin") == true)

// After
if (Context.User?.IsInRole(UserRoles.Admin) == true)
```

### Phase 6: Configuration (WebApi Layer)

**File**: `Program.cs`

**Pattern**: Role initialization
```csharp
// Before
if (!await roleManager.RoleExistsAsync("Admin"))
    await roleManager.CreateAsync(new IdentityRole("Admin"));

// After
if (!await roleManager.RoleExistsAsync(UserRoles.Admin))
    await roleManager.CreateAsync(new IdentityRole(UserRoles.Admin));
```

### Phase 7: Tests

**File**: `AuthControllerUnitTests.cs`

**Pattern**: Test data and assertions
```csharp
// Before
"Admin"
Assert.Equal("Admin", request.Role);
var allowedRoles = new[] { "Owner", "Admin" };

// After
UserRoles.Admin
Assert.Equal(UserRoles.Admin, request.Role);
var allowedRoles = new[] { UserRoles.Owner, UserRoles.Admin };
```

## File Modification Checklist

### Controllers
- [ ] `AuthController.cs` - 10+ occurrences
- [ ] `AdminPaymentsController.cs` - 1 occurrence
- [ ] `AdminDebtsController.cs` - 1 occurrence
- [ ] `AnnouncementsController.cs` - 4 occurrences
- [ ] `ExpensesController.cs` - 3 occurrences
- [ ] `IncidentsController.cs` - 3 occurrences
- [ ] `NotificationsController.cs` - 2 occurrences
- [ ] `OwnersController.cs` - 1 occurrence
- [ ] `DebtsController.cs` - 1 occurrence
- [ ] `PollsController.cs` - 3+ occurrences

### Services
- [ ] `NotificationService.cs` - 3 occurrences

### Attributes
- [ ] `OwnerAuthorizeAttribute.cs` - 2 occurrences

### DTOs
- [ ] `AuthDtos.cs` - 1 occurrence (regex)

### Hubs
- [ ] `NotificationHub.cs` - 2 occurrences

### Configuration
- [ ] `Program.cs` - 4 occurrences

### Tests
- [ ] `AuthControllerUnitTests.cs` - 8+ occurrences

## Import Statement

All modified files will need this import at the top:
```csharp
using CondoFlow.Domain.Enums;
```

## Testing Strategy

### 1. Compilation Test
- Ensure the solution compiles without errors after each file modification
- Use `dotnet build` to verify

### 2. Unit Tests
- Run existing unit tests to ensure no behavioral changes
- All tests in `AuthControllerUnitTests.cs` should pass

### 3. Manual Testing (if needed)
- Test user registration with Admin and Owner roles
- Test authorization on protected endpoints
- Test SignalR admin notifications

### 4. Grep Verification
After refactoring, run:
```bash
grep -r '"Admin"' --include="*.cs" backend-services/src/
grep -r '"Owner"' --include="*.cs" backend-services/src/
```
Should return zero results (except in comments/documentation).

## Rollback Plan

If issues are discovered:
1. Revert all changes using git
2. Review the specific file causing issues
3. Fix and re-apply changes incrementally

## Code Review Checklist

- [ ] All hardcoded role strings replaced
- [ ] All files have necessary imports
- [ ] No compilation errors
- [ ] All tests pass
- [ ] No new hardcoded strings introduced
- [ ] Code follows project naming conventions
- [ ] Changes are consistent across all files

## Benefits

1. **Type Safety**: Compile-time checking prevents typos
2. **IntelliSense**: IDE autocomplete for role names
3. **Maintainability**: Single source of truth for roles
4. **Refactoring**: Easy to rename roles in the future
5. **Consistency**: Uniform role references across codebase
6. **DRY Compliance**: Eliminates duplication per steering files

## Risks and Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking authorization | Thorough testing of all endpoints |
| Missing occurrences | Use grep to verify before/after |
| Regex pattern issues | Test DTOs validation carefully |
| Test failures | Run tests after each phase |

## Success Metrics

- **Zero Hardcoded Strings**: No "Admin" or "Owner" in role contexts
- **100% Test Pass Rate**: All existing tests pass
- **Zero Compilation Errors**: Clean build
- **Code Review Approved**: Passes review checklist

## Future Enhancements

After this refactoring, consider:
1. Adding more roles (e.g., `Moderator`, `Guest`)
2. Creating a role-based permission system
3. Adding role descriptions/metadata
4. Implementing role hierarchy

## References

- `Domain/Enums/UserRoles.cs` - The enum definition
- `Domain/Enums/StatusCodes.cs` - Similar pattern for status codes
- Steering files: `clean-architecture.md`, `backend-architecture.md`

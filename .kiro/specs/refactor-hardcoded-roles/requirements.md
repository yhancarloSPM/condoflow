# Refactor Hardcoded Role Strings to Use UserRoles Enum

## Overview

Replace all hardcoded role strings ("Admin", "Owner") throughout the codebase with the newly created `UserRoles` enum constants to follow the DRY (Don't Repeat Yourself) principle and improve maintainability.

## Background

The codebase currently has hardcoded role strings scattered across multiple files:
- Controllers (AuthController, AdminPaymentsController, AnnouncementsController, etc.)
- Services (NotificationService)
- Attributes (OwnerAuthorizeAttribute)
- DTOs (AuthDtos)
- Tests (AuthControllerUnitTests)
- Program.cs (role initialization)

A new `UserRoles` enum has been created in `Domain/Enums/UserRoles.cs` with constants:
- `UserRoles.Admin = "Admin"`
- `UserRoles.Owner = "Owner"`

## Problem Statement

**Current Issues:**
1. **Violation of DRY Principle**: Role strings are duplicated across 15+ files
2. **Error-Prone**: Typos in role strings can cause runtime bugs
3. **Hard to Refactor**: Changing a role name requires finding all occurrences
4. **No IntelliSense**: Developers must remember exact role strings
5. **Inconsistent**: Some files may use different casing or variations

## User Stories

### 1. As a Developer
**I want** all role references to use the `UserRoles` enum constants  
**So that** I have compile-time safety and IntelliSense support when working with roles

**Acceptance Criteria:**
- 1.1 All hardcoded "Admin" strings are replaced with `UserRoles.Admin`
- 1.2 All hardcoded "Owner" strings are replaced with `UserRoles.Owner`
- 1.3 The code compiles without errors after refactoring
- 1.4 All existing tests pass after refactoring
- 1.5 No hardcoded role strings remain in the codebase (except in comments/documentation)

### 2. As a Maintainer
**I want** role definitions centralized in one location  
**So that** future role changes only require updating one file

**Acceptance Criteria:**
- 2.1 The `UserRoles` enum is the single source of truth for role names
- 2.2 All role comparisons use the enum constants
- 2.3 Role initialization in Program.cs uses the enum constants
- 2.4 Authorization attributes use the enum constants

### 3. As a Quality Assurance Engineer
**I want** the refactoring to be non-breaking  
**So that** existing functionality continues to work exactly as before

**Acceptance Criteria:**
- 3.1 All API endpoints continue to work with the same authorization rules
- 3.2 User registration with "Admin" and "Owner" roles still works
- 3.3 Role-based authorization in controllers still functions correctly
- 3.4 SignalR hub authorization still works for Admin users
- 3.5 Notification routing to Admin users still functions

## Scope

### In Scope
- Replace hardcoded role strings in:
  - Controllers (all `[Authorize(Roles = "...")]` attributes)
  - Services (NotificationService role references)
  - Attributes (OwnerAuthorizeAttribute role checks)
  - DTOs (AuthDtos role validation)
  - Program.cs (role initialization)
  - Tests (AuthControllerUnitTests role assertions)
  - Hubs (NotificationHub role checks)

### Out of Scope
- Adding new roles (only refactoring existing "Admin" and "Owner")
- Changing authorization logic or business rules
- Modifying database schema or migrations
- Updating frontend code (Angular)

## Files to Modify

Based on the search results, the following files need refactoring:

1. **Controllers** (11 files):
   - `AuthController.cs` - Multiple role checks and Authorize attributes
   - `AdminPaymentsController.cs` - Authorize attribute
   - `AdminDebtsController.cs` - Authorize attribute
   - `AnnouncementsController.cs` - Multiple Authorize attributes
   - `ExpensesController.cs` - Multiple Authorize attributes
   - `IncidentsController.cs` - Authorize attributes and role checks
   - `NotificationsController.cs` - Role checks in logic
   - `OwnersController.cs` - Authorize attribute
   - `DebtsController.cs` - Authorize attribute
   - `PollsController.cs` - Multiple Authorize attributes

2. **Services** (1 file):
   - `NotificationService.cs` - Role strings in notification routing

3. **Attributes** (1 file):
   - `OwnerAuthorizeAttribute.cs` - Role checks in authorization logic

4. **DTOs** (1 file):
   - `AuthDtos.cs` - Role validation regex

5. **Hubs** (1 file):
   - `NotificationHub.cs` - Role checks for admin group

6. **Configuration** (1 file):
   - `Program.cs` - Role initialization

7. **Tests** (1 file):
   - `AuthControllerUnitTests.cs` - Role assertions and test data

## Technical Considerations

### Import Statement
All files will need to add:
```csharp
using CondoFlow.Domain.Enums;
```

### Authorize Attribute Syntax
The `[Authorize(Roles = "...")]` attribute requires a constant string, so we can use:
```csharp
[Authorize(Roles = UserRoles.Admin)]
```

### String Interpolation
For cases where roles are used in string interpolation or concatenation, the enum constants can be used directly since they're `const string`.

### Regex Validation
The DTOs regex validation will need to be updated to use the enum constants in a pattern.

## Success Criteria

1. **Zero Hardcoded Strings**: No "Admin" or "Owner" strings remain in role-related code
2. **All Tests Pass**: Existing unit and integration tests pass without modification
3. **Compilation Success**: The solution compiles without errors or warnings
4. **Functional Equivalence**: All authorization and role-based logic works identically
5. **Code Review Approval**: Changes follow the project's steering file guidelines

## Risks and Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking authorization logic | High | Thorough testing of all role-based endpoints |
| Missing some hardcoded strings | Medium | Use comprehensive grep search before and after |
| Incorrect constant usage | Medium | Code review and compilation checks |
| Test failures | Low | Run full test suite after refactoring |

## Definition of Done

- [ ] All hardcoded "Admin" and "Owner" strings replaced with `UserRoles` constants
- [ ] All files have the necessary `using CondoFlow.Domain.Enums;` import
- [ ] Solution compiles without errors
- [ ] All existing tests pass
- [ ] Code review completed and approved
- [ ] No new hardcoded role strings introduced
- [ ] Documentation updated if necessary

## References

- **Steering Files**: 
  - `clean-architecture.md` - DRY principle
  - `backend-architecture.md` - Domain layer enums
  - `automapper-conventions.md` - Naming conventions
- **Related Files**:
  - `Domain/Enums/UserRoles.cs` - The new enum
  - `Domain/Enums/StatusCodes.cs` - Similar pattern for status codes

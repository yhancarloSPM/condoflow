using AutoMapper;
using CondoFlow.Application.DTOs;
using CondoFlow.Application.Common.DTOs.Reservation;
using CondoFlow.Domain.Entities;
using CondoFlow.Domain.Enums;

namespace CondoFlow.Application.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // Debt mappings
        CreateMap<Debt, DebtDto>()
            .ForMember(dest => dest.Amount, opt => opt.MapFrom(src => src.Amount.Amount))
            .ForMember(dest => dest.Currency, opt => opt.MapFrom(src => src.Amount.Currency))
            .ForMember(dest => dest.PaidAmount, opt => opt.MapFrom(src => src.PaidAmount.Amount))
            .ForMember(dest => dest.RemainingAmount, opt => opt.MapFrom(src => src.RemainingAmount.Amount))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => 
                src.Status == StatusPayments.PaymentSubmitted ? StatusPayments.PaymentSubmitted :
                src.Status == StatusPayments.Paid ? StatusPayments.Paid :
                src.IsOverdue ? StatusPayments.Overdue : StatusPayments.Pending))
            .ForMember(dest => dest.IsPaid, opt => opt.MapFrom(src => src.IsPaid))
            .ForMember(dest => dest.IsOverdue, opt => opt.MapFrom(src => src.IsOverdue))
            .ForMember(dest => dest.IsPartiallyPaid, opt => opt.MapFrom(src => src.IsPartiallyPaid))
            .ForMember(dest => dest.Description, opt => opt.MapFrom(src => src.Concept))
            .ForMember(dest => dest.OwnerName, opt => opt.Ignore())
            .ForMember(dest => dest.Apartment, opt => opt.Ignore());
        
        // Payment mappings
        CreateMap<Payment, PaymentDto>();
        
        // Incident mappings
        CreateMap<Incident, IncidentDto>()
            .ForMember(dest => dest.ImageUrl, opt => opt.MapFrom(src => src.ImageData));
        
        // Expense mappings
        CreateMap<Expense, ExpenseDto>()
            .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category != null ? src.Category.Name : string.Empty))
            .ForMember(dest => dest.ProviderName, opt => opt.MapFrom(src => src.Provider != null ? src.Provider.Name : string.Empty))
            .ForMember(dest => dest.StatusName, opt => opt.MapFrom(src => src.Status != null ? src.Status.Name : string.Empty));
        CreateMap<CreateExpenseDto, Expense>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.StatusId, opt => opt.Ignore()) // Se asigna manualmente
            .ForMember(dest => dest.InvoiceUrl, opt => opt.Ignore()) // Se asigna manualmente
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore()) // Se asigna manualmente
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.Category, opt => opt.Ignore())
            .ForMember(dest => dest.Status, opt => opt.Ignore())
            .ForMember(dest => dest.Provider, opt => opt.Ignore());
        CreateMap<UpdateExpenseDto, Expense>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.InvoiceUrl, opt => opt.Ignore()) // Se maneja manualmente
            .ForMember(dest => dest.Category, opt => opt.Ignore())
            .ForMember(dest => dest.Status, opt => opt.Ignore())
            .ForMember(dest => dest.Provider, opt => opt.Ignore());
        CreateMap<ExpenseCategory, ExpenseCategoryDto>();
        CreateMap<object, ExpenseCategoryDto>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => GetDynamicProperty(src, "Id")))
            .ForMember(dest => dest.Name, opt => opt.MapFrom(src => GetDynamicProperty(src, "Name")))
            .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => GetDynamicProperty(src, "IsActive")));
        CreateMap<object, ExpenseStatusDto>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => GetDynamicProperty(src, "Id")))
            .ForMember(dest => dest.Name, opt => opt.MapFrom(src => GetDynamicProperty(src, "Name")))
            .ForMember(dest => dest.Code, opt => opt.MapFrom(src => GetDynamicProperty(src, "Code")))
            .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => GetDynamicProperty(src, "IsActive")));
        
        // Provider mappings
        CreateMap<Provider, ProviderDto>();
        CreateMap<CreateProviderDto, Provider>();
        CreateMap<UpdateProviderDto, Provider>();
        
        // Poll mappings
        CreateMap<Poll, PollDto>()
            .ForMember(dest => dest.Type, opt => opt.MapFrom(src => src.Type.ToString()))
            .ForMember(dest => dest.Options, opt => opt.Ignore()) // Se mapean manualmente con lógica adicional
            .ForMember(dest => dest.Stats, opt => opt.Ignore()) // Se calculan manualmente
            .ForMember(dest => dest.HasUserVoted, opt => opt.Ignore()) // Se calcula manualmente
            .ForMember(dest => dest.UserVoteOptionId, opt => opt.Ignore()) // Se calcula manualmente
            .ForMember(dest => dest.UserVoteOptionIds, opt => opt.Ignore()); // Se calcula manualmente
        CreateMap<PollOption, PollOptionDto>()
            .ForMember(dest => dest.VoteCount, opt => opt.MapFrom(src => src.Votes != null ? src.Votes.Count : 0))
            .ForMember(dest => dest.Percentage, opt => opt.Ignore()) // Se calcula manualmente
            .ForMember(dest => dest.Voters, opt => opt.Ignore()); // Se mapean manualmente según IsAnonymous
        CreateMap<CreatePollDto, Poll>()
            .ForMember(dest => dest.Type, opt => opt.MapFrom(src => (PollType)src.Type))
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.IsDeleted, opt => opt.Ignore())
            .ForMember(dest => dest.DeletedAt, opt => opt.Ignore())
            .ForMember(dest => dest.Options, opt => opt.Ignore())
            .ForMember(dest => dest.Votes, opt => opt.Ignore());
        
        // Status mappings
        CreateMap<Status, StatusDto>();
        
        // Reservation mappings
        CreateMap<Reservation, ReservationDto>();
        CreateMap<ReservationSlot, ReservationSlotDto>();
        
        // Announcement mappings
        CreateMap<Announcement, AnnouncementDto>()
            .ForMember(dest => dest.AnnouncementTypeName, opt => opt.MapFrom(src => src.AnnouncementType != null ? src.AnnouncementType.Name : string.Empty));
        
        // Owner mappings
        CreateMap<Owner, OwnerDto>()
            .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => $"{src.FirstName} {src.LastName}"));
        CreateMap<object, OwnerDto>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => GetDynamicProperty(src, "OwnerId")))
            .ForMember(dest => dest.FirstName, opt => opt.MapFrom(src => GetDynamicProperty(src, "FirstName")))
            .ForMember(dest => dest.LastName, opt => opt.MapFrom(src => GetDynamicProperty(src, "LastName")))
            .ForMember(dest => dest.Email, opt => opt.MapFrom(src => GetDynamicProperty(src, "Email")))
            .ForMember(dest => dest.PhoneNumber, opt => opt.MapFrom(src => GetDynamicProperty(src, "PhoneNumber")))
            .ForMember(dest => dest.ApartmentId, opt => opt.MapFrom(src => GetDynamicProperty(src, "ApartmentId")))
            .ForMember(dest => dest.FullName, opt => opt.Ignore());
        CreateMap<Debt, OwnerDebtDetailDto>()
            .ForMember(dest => dest.Amount, opt => opt.MapFrom(src => src.Amount.Amount))
            .ForMember(dest => dest.Currency, opt => opt.MapFrom(src => src.Amount.Currency))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));
        
        // Apartment mappings
        CreateMap<Apartment, ApartmentDto>()
            .ForMember(dest => dest.BlockName, opt => opt.MapFrom(src => src.Block != null ? src.Block.Name : string.Empty));
        
        // Block mappings
        CreateMap<Block, BlockDto>();
        
        // User mappings
        CreateMap<object, UserDto>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => GetDynamicProperty(src, "Id")))
            .ForMember(dest => dest.FirstName, opt => opt.MapFrom(src => GetDynamicProperty(src, "FirstName")))
            .ForMember(dest => dest.LastName, opt => opt.MapFrom(src => GetDynamicProperty(src, "LastName")))
            .ForMember(dest => dest.Email, opt => opt.MapFrom(src => GetDynamicProperty(src, "Email")))
            .ForMember(dest => dest.PhoneNumber, opt => opt.MapFrom(src => GetDynamicProperty(src, "PhoneNumber")))
            .ForMember(dest => dest.ApartmentId, opt => opt.MapFrom(src => GetDynamicProperty(src, "ApartmentId")))
            .ForMember(dest => dest.Apartment, opt => opt.MapFrom(src => GetDynamicProperty(src, "Apartment")))
            .ForMember(dest => dest.OwnerId, opt => opt.MapFrom(src => GetDynamicProperty(src, "OwnerId")))
            .ForMember(dest => dest.IsApproved, opt => opt.MapFrom(src => GetDynamicProperty(src, "IsApproved")))
            .ForMember(dest => dest.IsRejected, opt => opt.MapFrom(src => GetDynamicProperty(src, "IsRejected")));
    }
    
    private static object? GetDynamicProperty(object source, string propertyName)
    {
        try
        {
            var type = source.GetType();
            var property = type.GetProperty(propertyName);
            return property?.GetValue(source);
        }
        catch
        {
            return null;
        }
    }
}

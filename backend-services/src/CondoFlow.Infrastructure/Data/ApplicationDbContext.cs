using CondoFlow.Domain.Entities;
using CondoFlow.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace CondoFlow.Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<Payment> Payments { get; set; }
    public DbSet<Debt> Debts { get; set; }
    public DbSet<Block> Blocks { get; set; }
    public DbSet<Apartment> Apartments { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<PaymentConcept> PaymentConcepts { get; set; }
    public DbSet<Announcement> Announcements { get; set; }
    public DbSet<NotificationHistory> NotificationHistories { get; set; }
    public DbSet<Reservation> Reservations { get; set; }
    public DbSet<ReservationSlot> ReservationSlots { get; set; }
    public DbSet<Incident> Incidents { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Priority> Priorities { get; set; }
    public DbSet<Status> Statuses { get; set; }
    public DbSet<EventType> EventTypes { get; set; }
    public DbSet<Expense> Expenses { get; set; }
    public DbSet<ExpenseCategory> ExpenseCategories { get; set; }
    public DbSet<Provider> Providers { get; set; }
    public DbSet<AnnouncementType> AnnouncementTypes { get; set; }
    public DbSet<Poll> Polls { get; set; }
    public DbSet<PollOption> PollOptions { get; set; }
    public DbSet<PollVote> PollVotes { get; set; }


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.OwnerId).IsRequired();
            entity.Property(e => e.DebtId);
            entity.Property(e => e.PaymentMethod).HasMaxLength(50).IsRequired();
            entity.Property(e => e.ReceiptData);
            entity.Property(e => e.Status).HasConversion<string>();
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.PaymentDate).IsRequired();

            entity.OwnsOne(e => e.Amount, money =>
            {
                money.Property(m => m.Amount).HasColumnName("Amount").HasPrecision(18, 2);
                money.Property(m => m.Currency).HasColumnName("Currency").HasMaxLength(3);
            });
        });
        
        modelBuilder.Entity<Debt>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.OwnerId).IsRequired();
            entity.Property(e => e.Concept).HasMaxLength(200).IsRequired();
            entity.Property(e => e.DueDate).IsRequired();
            entity.Property(e => e.Status).HasMaxLength(20).IsRequired();
            entity.Property(e => e.Month).IsRequired();
            entity.Property(e => e.Year).IsRequired();
            entity.Property(e => e.CreatedAt).IsRequired();
            
            entity.OwnsOne(e => e.Amount, money =>
            {
                money.Property(m => m.Amount).HasColumnName("Amount").HasPrecision(18, 2);
                money.Property(m => m.Currency).HasColumnName("Currency").HasMaxLength(3);
            });
            
            entity.OwnsOne(e => e.PaidAmount, money =>
            {
                money.Property(m => m.Amount).HasColumnName("PaidAmount").HasPrecision(18, 2);
                money.Property(m => m.Currency).HasColumnName("PaidCurrency").HasMaxLength(3);
            });
        });
        
        modelBuilder.Ignore<Owner>();
        
        // Configurar Incident
        modelBuilder.Entity<Incident>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.OwnerId).IsRequired();
            entity.Property(e => e.Title).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(1000).IsRequired();
            entity.Property(e => e.Status).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Priority).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Category).HasMaxLength(50).IsRequired();
            entity.Property(e => e.ImageUrl).HasMaxLength(500);
            entity.Property(e => e.CreatedAt).IsRequired();
        });
        
        // Configurar Block
        modelBuilder.Entity<Block>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(10).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(100);
        });
        
        // Configurar Apartment
        modelBuilder.Entity<Apartment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Number).HasMaxLength(10).IsRequired();
            entity.Property(e => e.MonthlyMaintenanceAmount).HasPrecision(18, 2).IsRequired();
            entity.HasOne(e => e.Block)
                  .WithMany(b => b.Apartments)
                  .HasForeignKey(e => e.BlockId);
            
            // Índice único para Block + Number
            entity.HasIndex(e => new { e.BlockId, e.Number })
                  .IsUnique()
                  .HasDatabaseName("IX_Apartment_Block_Number_Unique");
        });
        
        // Configurar ApplicationUser
        modelBuilder.Entity<ApplicationUser>(entity =>
        {
            entity.HasOne(u => u.ApartmentEntity)
                  .WithMany()
                  .HasForeignKey(u => u.ApartmentId)
                  .OnDelete(DeleteBehavior.SetNull);
            
            // Índice único para ApartmentId
            entity.HasIndex(u => u.ApartmentId)
                  .IsUnique()
                  .HasFilter("[ApartmentId] IS NOT NULL")
                  .HasDatabaseName("IX_ApplicationUser_ApartmentId_Unique");
        });
        
        // Configurar Notification
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Message).HasMaxLength(500).IsRequired();
            entity.Property(e => e.Type).HasMaxLength(50).IsRequired();
            entity.Property(e => e.UserId).HasMaxLength(450);
            entity.Property(e => e.RelatedEntityId).HasMaxLength(50);
            entity.Property(e => e.CreatedAt).IsRequired();
        });
        
        // Configurar NotificationHistory
        modelBuilder.Entity<NotificationHistory>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.DebtId).IsRequired();
            entity.Property(e => e.NotificationType).HasMaxLength(50).IsRequired();
            entity.Property(e => e.UserId).HasMaxLength(450).IsRequired();
            entity.Property(e => e.SentDate).IsRequired();
            
            // Índice único para evitar duplicados
            entity.HasIndex(e => new { e.DebtId, e.NotificationType })
                  .IsUnique()
                  .HasDatabaseName("IX_NotificationHistory_Debt_Type_Unique");
        });
        
        // Configurar Reservation
        modelBuilder.Entity<Reservation>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).HasMaxLength(450).IsRequired();
            entity.Property(e => e.ReservationDate).IsRequired();
            entity.Property(e => e.StartTime).IsRequired();
            entity.Property(e => e.EndTime).IsRequired();
            entity.Property(e => e.Status).HasConversion<string>().IsRequired();
            entity.Property(e => e.Notes).HasMaxLength(500);
            entity.Property(e => e.EventTypeCode).HasMaxLength(50);

            entity.HasIndex(e => new { e.ReservationDate, e.StartTime, e.EndTime })
                  .IsUnique()
                  .HasDatabaseName("IX_Reservation_DateTime_Unique");
        });
        
        // Configurar EventType
        modelBuilder.Entity<EventType>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Code).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.IsActive).IsRequired();
            entity.Property(e => e.Order).IsRequired();
            
            entity.HasIndex(e => e.Code)
                  .IsUnique()
                  .HasDatabaseName("IX_EventTypes_Code_Unique");
        });
        
        // Configurar ReservationSlot
        modelBuilder.Entity<ReservationSlot>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            entity.Property(e => e.StartTime).IsRequired();
            entity.Property(e => e.EndTime).IsRequired();
            entity.Property(e => e.IsAvailable).IsRequired();
        });
        
        // Seed Blocks
        modelBuilder.Entity<Block>().HasData(
            new Block { Id = 1, Name = "Q", Description = "Bloque Q", IsActive = true },
            new Block { Id = 2, Name = "P", Description = "Bloque P", IsActive = true },
            new Block { Id = 3, Name = "N", Description = "Bloque N", IsActive = true },
            new Block { Id = 4, Name = "M", Description = "Bloque M", IsActive = true },
            new Block { Id = 5, Name = "O", Description = "Bloque O", IsActive = true }
        );
        
        // Seed Apartments - Q(1), P(2), O(5) hasta 501; N(3), M(4) hasta 402
        var apartments = new List<object>();
        int apartmentId = 1;
        
        // Bloque Q (Id=1) - hasta 402
        for (int floor = 1; floor <= 4; floor++)
        {
            for (int unit = 1; unit <= 2; unit++)
            {
                apartments.Add(new { Id = apartmentId++, Number = $"{floor}0{unit}", Floor = floor, BlockId = 1, IsActive = true, MonthlyMaintenanceAmount = 2000m });
            }
        }
        
        // Bloque P (Id=2) - hasta 501
        for (int floor = 1; floor <= 5; floor++)
        {
            int maxUnit = (floor == 5) ? 1 : 2; // Solo 501, no 502
            for (int unit = 1; unit <= maxUnit; unit++)
            {
                decimal amount = (floor == 5 && unit == 1) ? 1000m : 2000m; // 501 = $1000, resto = $2000
                apartments.Add(new { Id = apartmentId++, Number = $"{floor}0{unit}", Floor = floor, BlockId = 2, IsActive = true, MonthlyMaintenanceAmount = amount });
            }
        }
        
        // Bloque N (Id=3) - solo terminados en 01
        for (int floor = 1; floor <= 4; floor++)
        {
            apartments.Add(new { Id = apartmentId++, Number = $"{floor}01", Floor = floor, BlockId = 3, IsActive = true, MonthlyMaintenanceAmount = 2000m });
        }
        
        // Bloque M (Id=4) - hasta 402
        for (int floor = 1; floor <= 4; floor++)
        {
            for (int unit = 1; unit <= 2; unit++)
            {
                apartments.Add(new { Id = apartmentId++, Number = $"{floor}0{unit}", Floor = floor, BlockId = 4, IsActive = true, MonthlyMaintenanceAmount = 2000m });
            }
        }
        
        // Bloque O (Id=5) - hasta 501
        for (int floor = 1; floor <= 5; floor++)
        {
            int maxUnit = (floor == 5) ? 1 : 2; // Solo 501, no 502
            for (int unit = 1; unit <= maxUnit; unit++)
            {
                decimal amount = (floor == 5 && unit == 1) ? 1000m : 2000m; // 501 = $1000, resto = $2000
                apartments.Add(new { Id = apartmentId++, Number = $"{floor}0{unit}", Floor = floor, BlockId = 5, IsActive = true, MonthlyMaintenanceAmount = amount });
            }
        }
        
        modelBuilder.Entity<Apartment>().HasData(apartments.ToArray());
        
        // Seed dummy debts data
        var sampleOwnerId = Guid.Parse("12345678-1234-1234-1234-123456789012");
        var debt1Id = Guid.Parse("87654321-4321-4321-4321-210987654321");
        var debt2Id = Guid.Parse("87654321-4321-4321-4321-210987654322");
        var debt3Id = Guid.Parse("87654321-4321-4321-4321-210987654323");
        var debt4Id = Guid.Parse("87654321-4321-4321-4321-210987654324");
        
        modelBuilder.Entity<Debt>().HasData(
            new 
            {
                Id = debt1Id,
                OwnerId = sampleOwnerId,
                DueDate = new DateTime(2024, 12, 31),
                Concept = "Mantenimiento Diciembre 2024",
                Status = "Pending",
                Month = 12,
                Year = 2024,
                CreatedAt = new DateTime(2024, 12, 1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = (DateTime?)null
            },
            new 
            {
                Id = debt2Id,
                OwnerId = sampleOwnerId,
                DueDate = new DateTime(2024, 11, 30),
                Concept = "Mantenimiento Noviembre 2024",
                Status = "Pending",
                Month = 11,
                Year = 2024,
                CreatedAt = new DateTime(2024, 11, 1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = (DateTime?)null
            },
            new 
            {
                Id = debt3Id,
                OwnerId = sampleOwnerId,
                DueDate = new DateTime(2024, 10, 31),
                Concept = "Mantenimiento Octubre 2024",
                Status = "Paid",
                Month = 10,
                Year = 2024,
                CreatedAt = new DateTime(2024, 10, 1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 10, 15, 0, 0, 0, DateTimeKind.Utc)
            },
            new 
            {
                Id = debt4Id,
                OwnerId = sampleOwnerId,
                DueDate = new DateTime(2025, 1, 31),
                Concept = "Mantenimiento Enero 2025",
                Status = "Pending",
                Month = 1,
                Year = 2025,
                CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = (DateTime?)null
            }
        );
        
        modelBuilder.Entity<Debt>().OwnsOne(e => e.Amount).HasData(
            new { DebtId = debt1Id, Amount = 2000.00m, Currency = "DOP" },
            new { DebtId = debt2Id, Amount = 2000.00m, Currency = "DOP" },
            new { DebtId = debt3Id, Amount = 2000.00m, Currency = "DOP" },
            new { DebtId = debt4Id, Amount = 2000.00m, Currency = "DOP" }
        );
        
        modelBuilder.Entity<Debt>().OwnsOne(e => e.PaidAmount).HasData(
            new { DebtId = debt1Id, Amount = 0.00m, Currency = "DOP" },
            new { DebtId = debt2Id, Amount = 0.00m, Currency = "DOP" },
            new { DebtId = debt3Id, Amount = 2000.00m, Currency = "DOP" },
            new { DebtId = debt4Id, Amount = 0.00m, Currency = "DOP" }
        );
        
        // Configurar Announcement
        modelBuilder.Entity<Announcement>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Content).HasMaxLength(1000).IsRequired();
            entity.Property(e => e.IsUrgent).IsRequired();
            entity.Property(e => e.EventDate);
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.CreatedBy).HasMaxLength(450).IsRequired();
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            
            entity.HasOne(e => e.AnnouncementType)
                  .WithMany()
                  .HasForeignKey(e => e.AnnouncementTypeId)
                  .OnDelete(DeleteBehavior.Restrict);
        });
        
        // Configurar AnnouncementType
        modelBuilder.Entity<AnnouncementType>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Code).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(200);
            entity.Property(e => e.IsActive).IsRequired();
            entity.Property(e => e.CreatedAt).IsRequired();
            
            entity.HasIndex(e => e.Code)
                  .IsUnique()
                  .HasDatabaseName("IX_AnnouncementTypes_Code_Unique");
        });
        
        // Configurar PaymentConcept
        modelBuilder.Entity<PaymentConcept>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Code).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
            entity.Property(e => e.DefaultAmount).HasPrecision(18, 2);
            entity.Property(e => e.RoofAmount).HasPrecision(18, 2);
        });
        
        // Seed PaymentConcepts
        modelBuilder.Entity<PaymentConcept>().HasData(
            new { Id = 1, Code = "maintenance", Name = "Pago de Mantenimiento", DefaultAmount = 2000m, RoofAmount = 1000m, IsAutoCalculated = true, IsActive = true, CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new { Id = 2, Code = "extraordinary", Name = "Cuota Extraordinaria", DefaultAmount = (decimal?)null, RoofAmount = (decimal?)null, IsAutoCalculated = false, IsActive = true, CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new { Id = 3, Code = "other", Name = "Otro", DefaultAmount = (decimal?)null, RoofAmount = (decimal?)null, IsAutoCalculated = false, IsActive = true, CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
        );
        
        // Seed Status data
        modelBuilder.Entity<Status>().HasData(
            new { Id = 1, Code = "pending", Name = "Pendiente", Description = "Estado pendiente", IsActive = true, CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new { Id = 2, Code = "confirmed", Name = "Confirmada", Description = "Estado confirmado", IsActive = true, CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new { Id = 3, Code = "rejected", Name = "Rechazada", Description = "Estado rechazado", IsActive = true, CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new { Id = 4, Code = "cancelled", Name = "Cancelada", Description = "Estado cancelado", IsActive = true, CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new { Id = 5, Code = "paid", Name = "Pagado", Description = "Estado pagado", IsActive = true, CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
        );
        
        // Seed EventType data
        modelBuilder.Entity<EventType>().HasData(
            new { Id = 1, Code = "birthday", Name = "Cumpleaños", Description = "Celebración de cumpleaños", IsActive = true, Order = 1, CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new { Id = 2, Code = "meeting", Name = "Reunión", Description = "Reunión familiar o de trabajo", IsActive = true, Order = 2, CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new { Id = 3, Code = "celebration", Name = "Celebración", Description = "Celebración general", IsActive = true, Order = 3, CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
        );
        
        // Configurar Expense
        modelBuilder.Entity<Expense>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Description).HasMaxLength(500).IsRequired();
            entity.Property(e => e.Amount).HasPrecision(18, 2).IsRequired();
            entity.Property(e => e.Date).IsRequired();
            entity.Property(e => e.Notes).HasMaxLength(1000);
            entity.Property(e => e.CreatedBy).HasMaxLength(450).IsRequired();
            entity.Property(e => e.CreatedAt).IsRequired();
            
            entity.HasOne(e => e.Category)
                  .WithMany(c => c.Expenses)
                  .HasForeignKey(e => e.CategoryId)
                  .OnDelete(DeleteBehavior.Restrict);
                  
            entity.HasOne(e => e.Status)
                  .WithMany()
                  .HasForeignKey(e => e.StatusId)
                  .OnDelete(DeleteBehavior.Restrict);
                  
            entity.HasOne(e => e.Provider)
                  .WithMany(p => p.Expenses)
                  .HasForeignKey(e => e.ProviderId)
                  .OnDelete(DeleteBehavior.SetNull);
        });
        
        // Configurar Provider
        modelBuilder.Entity<Provider>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Phone).HasMaxLength(20);
            entity.Property(e => e.Email).HasMaxLength(100);
            entity.Property(e => e.RNC).HasMaxLength(20);
            entity.Property(e => e.Address).HasMaxLength(300);
            entity.Property(e => e.IsActive).IsRequired();
            entity.Property(e => e.CreatedBy).HasMaxLength(450).IsRequired();
            entity.Property(e => e.CreatedAt).IsRequired();
        });
        
        // Configurar ExpenseCategory
        modelBuilder.Entity<ExpenseCategory>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            entity.Property(e => e.IsActive).IsRequired();
            entity.Property(e => e.CreatedAt).IsRequired();
        });
        

        
        // Seed ExpenseCategories
        modelBuilder.Entity<ExpenseCategory>().HasData(
            new { Id = 1, Name = "Mantenimiento", IsActive = true, CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new { Id = 2, Name = "Limpieza", IsActive = true, CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new { Id = 3, Name = "Seguridad", IsActive = true, CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new { Id = 4, Name = "Servicios", IsActive = true, CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new { Id = 5, Name = "Administración", IsActive = true, CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new { Id = 6, Name = "Reparaciones", IsActive = true, CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
        );
        
        // Seed AnnouncementTypes
        modelBuilder.Entity<AnnouncementType>().HasData(
            new { Id = 1, Code = "informativo", Name = "INFORMATIVO", Description = "Comunicado informativo general", IsActive = true, CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new { Id = 2, Code = "event", Name = "EVENTO", Description = "Comunicado sobre eventos programados", IsActive = true, CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new { Id = 3, Code = "notice", Name = "AVISO", Description = "Avisos importantes para los propietarios", IsActive = true, CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
        );
        
        // Configurar Poll
        modelBuilder.Entity<Poll>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(1000).IsRequired();
            entity.Property(e => e.Type).HasConversion<int>().IsRequired();
            entity.Property(e => e.StartDate).IsRequired();
            entity.Property(e => e.EndDate).IsRequired();
            entity.Property(e => e.IsActive).IsRequired();
            entity.Property(e => e.CreatedBy).HasMaxLength(450).IsRequired();
            entity.Property(e => e.CreatedAt).IsRequired();
        });
        
        // Configurar PollOption
        modelBuilder.Entity<PollOption>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Text).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Order).IsRequired();
            
            entity.HasOne(e => e.Poll)
                  .WithMany(p => p.Options)
                  .HasForeignKey(e => e.PollId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
        
        // Configurar PollVote
        modelBuilder.Entity<PollVote>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).HasMaxLength(450).IsRequired();
            entity.Property(e => e.VotedAt).IsRequired();
            
            entity.HasOne(e => e.Poll)
                  .WithMany(p => p.Votes)
                  .HasForeignKey(e => e.PollId)
                  .OnDelete(DeleteBehavior.Cascade);
                  
            entity.HasOne(e => e.PollOption)
                  .WithMany(o => o.Votes)
                  .HasForeignKey(e => e.PollOptionId)
                  .OnDelete(DeleteBehavior.Restrict);
            
            // Un usuario puede votar múltiples opciones en votación múltiple
            // El índice único debe incluir PollOptionId para permitir múltiples votos
            entity.HasIndex(e => new { e.PollId, e.UserId, e.PollOptionId })
                  .IsUnique()
                  .HasDatabaseName("IX_PollVote_Poll_User_Option_Unique");
        });
        

    }
}
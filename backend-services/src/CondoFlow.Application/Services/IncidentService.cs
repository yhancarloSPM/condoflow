using AutoMapper;
using CondoFlow.Application.DTOs;
using CondoFlow.Application.Interfaces.Repositories;
using CondoFlow.Application.Interfaces.Services;
using CondoFlow.Domain.Entities;
using CondoFlow.Domain.Enums;

namespace CondoFlow.Application.Services;

public class IncidentService : IIncidentService
{
    private readonly IIncidentRepository _incidentRepository;
    private readonly INotificationRepository _notificationRepository;
    private readonly IUserRepository _userRepository;
    private readonly IIdentityService _identityService;
    private readonly IMapper _mapper;

    public IncidentService(
        IIncidentRepository incidentRepository,
        INotificationRepository notificationRepository,
        IUserRepository userRepository,
        IIdentityService identityService,
        IMapper mapper)
    {
        _incidentRepository = incidentRepository;
        _notificationRepository = notificationRepository;
        _userRepository = userRepository;
        _identityService = identityService;
        _mapper = mapper;
    }

    public async Task<IncidentDto> CreateIncidentAsync(Guid ownerId, string title, string description, string category, string priority, string? imageData)
    {
        var incident = new Incident(ownerId, title, description, category, priority, imageData);
        await _incidentRepository.AddAsync(incident);
        
        // Crear notificación para admin
        var notification = new Notification(
            "Nueva Incidencia Reportada",
            $"Se ha reportado una nueva incidencia: {incident.Title}",
            "IncidentReported",
            "Admin",
            null,
            incident.Id.ToString()
        );
        await _notificationRepository.AddAsync(notification);
        
        return _mapper.Map<IncidentDto>(incident);
    }

    public async Task<IEnumerable<IncidentDto>> GetMyIncidentsAsync(Guid ownerId)
    {
        var incidents = await _incidentRepository.GetByOwnerIdAsync(ownerId);
        return _mapper.Map<IEnumerable<IncidentDto>>(incidents);
    }

    public async Task<IEnumerable<IncidentDto>> GetAllIncidentsAsync()
    {
        var incidents = await _incidentRepository.GetAllAsync();
        var users = await _userRepository.GetUsersWithApartmentsAsync();
        var usersArray = users as object[] ?? users.ToArray();

        var incidentDtos = _mapper.Map<List<IncidentDto>>(incidents);

        // Enriquecer con información del usuario
        foreach (var dto in incidentDtos)
        {
            dynamic? user = usersArray.FirstOrDefault(u =>
            {
                dynamic userData = u;
                return userData.Id == dto.OwnerId.ToString();
            });

            dto.OwnerName = user != null ? $"{user.FirstName} {user.LastName}" : "Usuario desconocido";
            dto.Apartment = user?.Apartment ?? "";
        }

        return incidentDtos;
    }

    public async Task<IncidentDto?> GetIncidentByIdAsync(Guid id)
    {
        var incident = await _incidentRepository.GetByIdAsync(id);
        return incident != null ? _mapper.Map<IncidentDto>(incident) : null;
    }

    public async Task UpdateIncidentStatusAsync(Guid id, string status, string? adminComment)
    {
        var incident = await _incidentRepository.GetByIdAsync(id);
        if (incident == null)
            throw new KeyNotFoundException("Incidencia no encontrada");

        incident.ChangeStatus(status, adminComment);
        await _incidentRepository.UpdateAsync(incident);

        // Enviar notificación al propietario
        var owner = await _identityService.FindUserByIdAsync(incident.OwnerId.ToString());
        if (owner != null)
        {
            dynamic ownerData = owner;
            var statusMessage = status switch
            {
                StatusCodes.InProgress => "Tu incidencia está siendo procesada",
                StatusCodes.Resolved => "Tu incidencia ha sido resuelta",
                StatusCodes.Cancelled => $"Tu incidencia ha sido cancelada. {adminComment}",
                _ => "El estado de tu incidencia ha cambiado"
            };

            var notification = new Notification(
                "Estado de Incidencia Actualizado",
                statusMessage,
                "IncidentStatusUpdate",
                "Owner",
                ownerData.Id,
                incident.Id.ToString()
            );

            await _notificationRepository.AddAsync(notification);
        }
    }

    public async Task CancelIncidentAsync(Guid id, Guid ownerId, string comment)
    {
        var incident = await _incidentRepository.GetByIdAsync(id);
        if (incident == null)
            throw new KeyNotFoundException("Incidencia no encontrada");

        if (incident.OwnerId != ownerId)
            throw new UnauthorizedAccessException("No tienes permiso para cancelar esta incidencia");

        if (incident.Status != StatusCodes.Reported)
            throw new InvalidOperationException("Solo se pueden cancelar incidencias reportadas");

        incident.ChangeStatus(StatusCodes.Cancelled, comment);
        await _incidentRepository.UpdateAsync(incident);

        // Enviar notificación al admin
        var notification = new Notification(
            "Incidencia Cancelada por Propietario",
            $"El propietario ha cancelado la incidencia: {incident.Title}. Motivo: {comment}",
            "IncidentCancelledByOwner",
            "Admin",
            null,
            incident.Id.ToString()
        );

        await _notificationRepository.AddAsync(notification);
    }

    public async Task<(byte[] fileBytes, string mimeType)?> GetIncidentImageAsync(Guid id, Guid userId, bool isAdmin)
    {
        var incident = await _incidentRepository.GetByIdAsync(id);
        if (incident == null)
            return null;

        // Verificar permisos
        if (!isAdmin && incident.OwnerId != userId)
            throw new UnauthorizedAccessException("No tienes permiso para ver esta imagen");

        if (string.IsNullOrEmpty(incident.ImageData))
            return null;

        // Si ImageData es base64, extraerlo y devolverlo
        if (incident.ImageData?.StartsWith("data:") == true)
        {
            var base64Data = incident.ImageData.Split(',')[1];
            var mimeType = incident.ImageData.Split(';')[0].Split(':')[1];
            var fileBytes = Convert.FromBase64String(base64Data);
            
            return (fileBytes, mimeType);
        }

        return null;
    }
}

using AutoMapper;
using CondoFlow.Application.Common.DTOs.Announcement;
using CondoFlow.Application.DTOs;
using CondoFlow.Application.Interfaces.Repositories;
using CondoFlow.Application.Interfaces.Services;
using CondoFlow.Domain.Entities;

namespace CondoFlow.Application.Services;

public class AnnouncementService : IAnnouncementService
{
    private readonly IAnnouncementRepository _announcementRepository;
    private readonly ICatalogRepository _catalogRepository;
    private readonly IMapper _mapper;

    public AnnouncementService(
        IAnnouncementRepository announcementRepository, 
        ICatalogRepository catalogRepository,
        IMapper mapper)
    {
        _announcementRepository = announcementRepository;
        _catalogRepository = catalogRepository;
        _mapper = mapper;
    }

    public async Task<IEnumerable<AnnouncementDto>> GetAllAnnouncementsAsync()
    {
        var announcements = await _announcementRepository.GetAllAsync();
        return _mapper.Map<IEnumerable<AnnouncementDto>>(announcements);
    }

    public async Task<AnnouncementDto> CreateAnnouncementAsync(CreateAnnouncementDto dto, string createdBy)
    {
        var announcement = new Announcement(
            dto.Title, 
            dto.Content, 
            dto.IsUrgent, 
            createdBy, 
            dto.TypeId ?? 1, 
            dto.EventDate);
            
        await _announcementRepository.AddAsync(announcement);
        return _mapper.Map<AnnouncementDto>(announcement);
    }

    public async Task<AnnouncementDto?> UpdateAnnouncementAsync(Guid id, UpdateAnnouncementDto dto)
    {
        var announcement = await _announcementRepository.GetByIdAsync(id);
        if (announcement == null)
            return null;

        announcement.Update(
            dto.Title, 
            dto.Content, 
            dto.IsUrgent, 
            dto.TypeId ?? announcement.AnnouncementTypeId, 
            dto.EventDate);
            
        await _announcementRepository.UpdateAsync(announcement);
        return _mapper.Map<AnnouncementDto>(announcement);
    }

    public async Task<IEnumerable<object>> GetAnnouncementTypesAsync()
    {
        return await _catalogRepository.GetAnnouncementTypesAsync();
    }

    public async Task<bool> UpdateAnnouncementTypeAsync(Guid announcementId, int announcementTypeId)
    {
        var announcement = await _announcementRepository.GetByIdAsync(announcementId);
        if (announcement == null)
            return false;

        var types = await _catalogRepository.GetAnnouncementTypesAsync();
        var typeExists = types.Any(t =>
        {
            dynamic type = t;
            return type.Id == announcementTypeId;
        });
        
        if (!typeExists)
            return false;

        announcement.Update(announcement.Title, announcement.Content, announcement.IsUrgent, announcementTypeId, announcement.EventDate);
        await _announcementRepository.UpdateAsync(announcement);
        return true;
    }

    public async Task<AnnouncementDto?> GetAnnouncementByIdAsync(Guid id)
    {
        var announcement = await _announcementRepository.GetByIdAsync(id);
        return announcement != null ? _mapper.Map<AnnouncementDto>(announcement) : null;
    }

    public async Task DeleteAnnouncementAsync(Guid id)
    {
        await _announcementRepository.DeleteAsync(id);
    }
}

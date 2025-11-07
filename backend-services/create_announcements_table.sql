-- Crear tabla Announcements
CREATE TABLE [dbo].[Announcements] (
    [Id] uniqueidentifier NOT NULL,
    [Title] nvarchar(200) NOT NULL,
    [Content] nvarchar(max) NOT NULL,
    [IsUrgent] bit NOT NULL,
    [CreatedBy] nvarchar(450) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_Announcements] PRIMARY KEY ([Id])
);
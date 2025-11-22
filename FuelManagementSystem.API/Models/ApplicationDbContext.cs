using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace FuelManagementSystem.API.Models;

public partial class ApplicationDbContext : DbContext
{
    public ApplicationDbContext()
    {
    }

    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Equipment> Equipment { get; set; }

    public virtual DbSet<Fuel> Fuels { get; set; }

    public virtual DbSet<Geyser> Geysers { get; set; }

    public virtual DbSet<GeyserEquipment> GeyserEquipments { get; set; }

    public virtual DbSet<GeyserFuel> GeyserFuels { get; set; }

    public virtual DbSet<Repair> Repairs { get; set; }

    public virtual DbSet<RepairEquipment> RepairEquipments { get; set; }

    public virtual DbSet<RepairGeyser> RepairGeysers { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<UsersRole> UsersRoles { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseSqlServer("Server=(localDB)\\MSSQLlocalDB;Database=ZapravkaLightVers;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=True;");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Equipment>(entity =>
        {
            entity.HasKey(e => e.IdEquipment);

            entity.Property(e => e.IdEquipment)
                .ValueGeneratedOnAdd()
                .HasColumnName("ID_Equipment");
            entity.Property(e => e.Brand).HasMaxLength(255);
            entity.Property(e => e.DateOfChange).HasColumnName("Date_of_change");
            entity.Property(e => e.DateOfRecording).HasColumnName("Date_of_recording");
            entity.Property(e => e.IdGeyser).HasColumnName("ID_Geyser");
            entity.Property(e => e.IdRepair).HasColumnName("ID_Repair");
            entity.Property(e => e.Name).HasMaxLength(255);
            entity.Property(e => e.Note).HasMaxLength(255);
            entity.Property(e => e.WhoChanged)
                .HasMaxLength(255)
                .HasColumnName("Who_changed");
            entity.Property(e => e.WhoRecorded)
                .HasMaxLength(255)
                .HasColumnName("Who_recorded");
        });

        modelBuilder.Entity<Fuel>(entity =>
        {
            entity.HasKey(e => e.IdFuel);

            entity.ToTable("Fuel");

            entity.Property(e => e.IdFuel)
                .ValueGeneratedOnAdd()
                .HasColumnName("ID_Fuel");
            entity.Property(e => e.Brand).HasMaxLength(255);
            entity.Property(e => e.Cost).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.DateOfChange).HasColumnName("Date_of_change");
            entity.Property(e => e.DateOfRecording).HasColumnName("Date_of_recording");
            entity.Property(e => e.Manufacturer).HasMaxLength(255);
            entity.Property(e => e.Note).HasColumnType("ntext");
            entity.Property(e => e.ShelfLife).HasColumnName("Shelf_life");
            entity.Property(e => e.WhoChanged)
                .HasMaxLength(255)
                .HasColumnName("Who_changed");
            entity.Property(e => e.WhoRecorded)
                .HasMaxLength(255)
                .HasColumnName("Who_recorded");
        });

        modelBuilder.Entity<Geyser>(entity =>
        {
            entity.HasKey(e => e.IdGeyser);

            entity.ToTable("Geyser");

            entity.Property(e => e.IdGeyser)
                .ValueGeneratedOnAdd()
                .HasColumnName("ID_Geyser");
            entity.Property(e => e.DateOfChange).HasColumnName("Date_of_change");
            entity.Property(e => e.DateOfRecording).HasColumnName("Date_of_recording");
            entity.Property(e => e.IdFuel).HasColumnName("ID_Fuel");
            entity.Property(e => e.IdRepair).HasColumnName("ID_Repair");
            entity.Property(e => e.Manufacturer).HasMaxLength(255);
            entity.Property(e => e.Note).HasMaxLength(255);
            entity.Property(e => e.WhoChanged)
                .HasMaxLength(255)
                .HasColumnName("Who_changed");
            entity.Property(e => e.WhoRecorded)
                .HasMaxLength(255)
                .HasColumnName("Who_recorded");
            entity.Property(e => e.YearOfRelease).HasColumnName("Year_of_release");
        });

        modelBuilder.Entity<GeyserEquipment>(entity =>
        {
            entity.HasKey(e => e.IdGeyserEquipment);

            entity.ToTable("GeyserEquipment");

            entity.Property(e => e.IdGeyserEquipment)
                .ValueGeneratedOnAdd()
                .HasColumnName("ID_GeyserEquipment");
            entity.Property(e => e.DateOfChange).HasColumnName("Date_of_change");
            entity.Property(e => e.DateOfRecording).HasColumnName("Date_of_recording");
            entity.Property(e => e.IdEquipment).HasColumnName("ID_Equipment");
            entity.Property(e => e.IdGeyser).HasColumnName("ID_Geyser");
            entity.Property(e => e.Note).HasMaxLength(255);
            entity.Property(e => e.WhoChanged)
                .HasMaxLength(255)
                .HasColumnName("Who_changed");
            entity.Property(e => e.WhoRecorded)
                .HasMaxLength(255)
                .HasColumnName("Who_recorded");

            entity.HasOne(d => d.IdEquipmentNavigation).WithMany(p => p.GeyserEquipments)
                .HasForeignKey(d => d.IdEquipment)
                .HasConstraintName("FK_GeyserEquipment_Equipment");

            entity.HasOne(d => d.IdGeyserNavigation).WithMany(p => p.GeyserEquipments)
                .HasForeignKey(d => d.IdGeyser)
                .HasConstraintName("FK_GeyserEquipment_Geyser");
        });

        modelBuilder.Entity<GeyserFuel>(entity =>
        {
            entity.HasKey(e => e.IdGeyserFuel);

            entity.ToTable("GeyserFuel");

            entity.Property(e => e.IdGeyserFuel)
                .ValueGeneratedOnAdd()
                .HasColumnName("ID_GeyserFuel");
            entity.Property(e => e.DateOfChange).HasColumnName("Date_of_change");
            entity.Property(e => e.DateOfRecording).HasColumnName("Date_of_recording");
            entity.Property(e => e.IdFuel).HasColumnName("ID_Fuel");
            entity.Property(e => e.IdGeyser).HasColumnName("ID_Geyser");
            entity.Property(e => e.Note).HasMaxLength(255);
            entity.Property(e => e.WhoChanged)
                .HasMaxLength(255)
                .HasColumnName("Who_changed");
            entity.Property(e => e.WhoRecorded)
                .HasMaxLength(255)
                .HasColumnName("Who_recorded");

            entity.HasOne(d => d.IdFuelNavigation).WithMany(p => p.GeyserFuels)
                .HasForeignKey(d => d.IdFuel)
                .HasConstraintName("FK_GeyserFuel_Fuel");

            entity.HasOne(d => d.IdGeyserNavigation).WithMany(p => p.GeyserFuels)
                .HasForeignKey(d => d.IdGeyser)
                .HasConstraintName("FK_GeyserFuel_Geyser");
        });

        modelBuilder.Entity<Repair>(entity =>
        {
            entity.HasKey(e => e.IdRepair);

            entity.ToTable("Repair");

            entity.Property(e => e.IdRepair)
                .ValueGeneratedOnAdd()
                .HasColumnName("ID_Repair");
            entity.Property(e => e.Cost).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.DateOfChange).HasColumnName("Date_of_change");
            entity.Property(e => e.DateOfRecording).HasColumnName("Date_of_recording");
            entity.Property(e => e.DateOfRepair).HasColumnName("Date_of_repair");
            entity.Property(e => e.Manufacturer).HasMaxLength(255);
            entity.Property(e => e.Name).HasMaxLength(255);
            entity.Property(e => e.Note).HasMaxLength(255);
            entity.Property(e => e.ReleaseDate).HasColumnName("Release_date");
            entity.Property(e => e.Repairman).HasMaxLength(255);
            entity.Property(e => e.WhoChanged)
                .HasMaxLength(255)
                .HasColumnName("Who_changed");
            entity.Property(e => e.WhoRecorded)
                .HasMaxLength(255)
                .HasColumnName("Who_recorded");
        });

        modelBuilder.Entity<RepairEquipment>(entity =>
        {
            entity.HasKey(e => e.IdRepairEquipment);

            entity.ToTable("RepairEquipment");

            entity.Property(e => e.IdRepairEquipment)
                .ValueGeneratedOnAdd()
                .HasColumnName("ID_RepairEquipment");
            entity.Property(e => e.DateOfChange).HasColumnName("Date_of_change");
            entity.Property(e => e.DateOfRecording).HasColumnName("Date_of_recording");
            entity.Property(e => e.IdEquipment).HasColumnName("ID_Equipment");
            entity.Property(e => e.IdRepair).HasColumnName("ID_Repair");
            entity.Property(e => e.Note).HasMaxLength(255);
            entity.Property(e => e.WhoChanged)
                .HasMaxLength(255)
                .HasColumnName("Who_changed");
            entity.Property(e => e.WhoRecorded)
                .HasMaxLength(255)
                .HasColumnName("Who_recorded");

            entity.HasOne(d => d.IdEquipmentNavigation).WithMany(p => p.RepairEquipments)
                .HasForeignKey(d => d.IdEquipment)
                .HasConstraintName("FK_RepairEquipment_Equipment");

            entity.HasOne(d => d.IdRepairNavigation).WithMany(p => p.RepairEquipments)
                .HasForeignKey(d => d.IdRepair)
                .HasConstraintName("FK_RepairEquipment_Repair");
        });

        modelBuilder.Entity<RepairGeyser>(entity =>
        {
            entity.HasKey(e => e.IdRepairGeyser);

            entity.ToTable("RepairGeyser");

            entity.Property(e => e.IdRepairGeyser)
                .ValueGeneratedOnAdd()
                .HasColumnName("ID_RepairGeyser");
            entity.Property(e => e.DateOfChange).HasColumnName("Date_of_change");
            entity.Property(e => e.DateOfRecording).HasColumnName("Date_of_recording");
            entity.Property(e => e.IdGeyser).HasColumnName("ID_Geyser");
            entity.Property(e => e.IdRepair).HasColumnName("ID_Repair");
            entity.Property(e => e.Note).HasMaxLength(255);
            entity.Property(e => e.WhoChanged)
                .HasMaxLength(255)
                .HasColumnName("Who_changed");
            entity.Property(e => e.WhoRecorded)
                .HasMaxLength(255)
                .HasColumnName("Who_recorded");

            entity.HasOne(d => d.IdGeyserNavigation).WithMany(p => p.RepairGeysers)
                .HasForeignKey(d => d.IdGeyser)
                .HasConstraintName("FK_RepairGeyser_Geyser");

            entity.HasOne(d => d.IdRepairNavigation).WithMany(p => p.RepairGeysers)
                .HasForeignKey(d => d.IdRepair)
                .HasConstraintName("FK_RepairGeyser_Repair");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.IdRoles);

            entity.Property(e => e.IdRoles)
                .ValueGeneratedOnAdd()
                .HasColumnName("ID_Roles");
            entity.Property(e => e.DateOfChange).HasColumnName("Date_of_change");
            entity.Property(e => e.DateOfRecording).HasColumnName("Date_of_recording");
            entity.Property(e => e.NameRole).HasMaxLength(255);
            entity.Property(e => e.Note).HasMaxLength(255);
            entity.Property(e => e.WhoChanged)
                .HasMaxLength(255)
                .HasColumnName("Who_changed");
            entity.Property(e => e.WhoRecorded)
                .HasMaxLength(255)
                .HasColumnName("Who_recorded");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.IdUsers);

            entity.Property(e => e.IdUsers)
                .ValueGeneratedOnAdd()
                .HasColumnName("ID_Users");
            entity.Property(e => e.DateOfChange).HasColumnName("Date_of_change");
            entity.Property(e => e.DateOfRecording).HasColumnName("Date_of_recording");
            entity.Property(e => e.Email).HasMaxLength(255);
            entity.Property(e => e.Login).HasMaxLength(255);
            entity.Property(e => e.Note).HasMaxLength(255);
            entity.Property(e => e.PasswordHash).HasMaxLength(255);
            entity.Property(e => e.WhoChanged)
                .HasMaxLength(255)
                .HasColumnName("Who_changed");
            entity.Property(e => e.WhoRecorded)
                .HasMaxLength(255)
                .HasColumnName("Who_recorded");
        });

        modelBuilder.Entity<UsersRole>(entity =>
        {
            entity.HasKey(e => e.IdUsersRoles);

            entity.Property(e => e.IdUsersRoles)
                .ValueGeneratedOnAdd()
                .HasColumnName("ID_UsersRoles");
            entity.Property(e => e.DateOfChange).HasColumnName("Date_of_change");
            entity.Property(e => e.DateOfRecording).HasColumnName("Date_of_recording");
            entity.Property(e => e.IdRoles).HasColumnName("ID_Roles");
            entity.Property(e => e.IdUsers).HasColumnName("ID_Users");
            entity.Property(e => e.Note).HasMaxLength(255);
            entity.Property(e => e.WhoChanged)
                .HasMaxLength(255)
                .HasColumnName("Who_changed");
            entity.Property(e => e.WhoRecorded)
                .HasMaxLength(255)
                .HasColumnName("Who_recorded");

            entity.HasOne(d => d.IdRolesNavigation).WithMany(p => p.UsersRoles)
                .HasForeignKey(d => d.IdRoles)
                .HasConstraintName("FK_UsersRoles_Roles");

            entity.HasOne(d => d.IdUsersNavigation).WithMany(p => p.UsersRoles)
                .HasForeignKey(d => d.IdUsers)
                .HasConstraintName("FK_UsersRoles_Users");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}

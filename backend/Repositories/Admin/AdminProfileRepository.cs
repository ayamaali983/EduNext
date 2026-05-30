using backend.Data.Generated;
using backend.DTOs.Admin;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories.Admin;

public class AdminProfileRepository : IAdminProfileRepository
{
    private readonly AppDbContext _context;
    private readonly PasswordHasher<object> _passwordHasher = new();

    public AdminProfileRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<AdminProfileDto?> GetProfileAsync(Guid adminId)
    {
        var admin = await _context.users
            .AsNoTracking()
            .Where(u => u.id == adminId && u.role == "admin")
            .Select(u => new
            {
                u.id,
                u.full_name,
                u.email,
                u.phone,
                u.role
            })
            .FirstOrDefaultAsync();

        if (admin == null)
        {
            return null;
        }

        return new AdminProfileDto
        {
            Id = admin.id,
            FullName = admin.full_name ?? "",
            Email = admin.email,
            Phone = admin.phone ?? "",
            Role = admin.role,
            RoleLabel = "مسؤول",
            Branch = "",
            AcademicYear = "",
            ActivityHistory = new List<AdminProfileActivityGroupDto>
            {
                new AdminProfileActivityGroupDto
                {
                    DateLabel = "اليوم",
                    Items = new List<AdminProfileActivityItemDto>
                    {
                        new AdminProfileActivityItemDto
                        {
                            Type = "achievement",
                            Text = "تم فتح لوحة تحكم الأدمن",
                            Time = DateTime.Now.ToString("HH:mm"),
                            Color = "purple"
                        }
                    }
                }
            }
        };
    }

    public async Task<AdminProfileDto?> UpdateProfileAsync(Guid adminId, UpdateAdminProfileDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.FullName))
        {
            return null;
        }

        var admin = await _context.users
            .FirstOrDefaultAsync(u => u.id == adminId && u.role == "admin");

        if (admin == null)
        {
            return null;
        }

        admin.full_name = dto.FullName.Trim();
        admin.phone = string.IsNullOrWhiteSpace(dto.Phone)
            ? null
            : dto.Phone.Trim();

        await _context.SaveChangesAsync();

        return await GetProfileAsync(adminId);
    }

    public async Task<bool> ChangePasswordAsync(Guid adminId, ChangeAdminPasswordDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.CurrentPassword) ||
            string.IsNullOrWhiteSpace(dto.NewPassword) ||
            dto.NewPassword != dto.ConfirmNewPassword ||
            dto.NewPassword.Length < 6)
        {
            return false;
        }

        var admin = await _context.users
            .FirstOrDefaultAsync(u => u.id == adminId && u.role == "admin");

        if (admin == null)
        {
            return false;
        }

        var verifyResult = _passwordHasher.VerifyHashedPassword(
            new object(),
            admin.password_hash,
            dto.CurrentPassword
        );

        if (verifyResult == PasswordVerificationResult.Failed)
        {
            return false;
        }

        admin.password_hash = _passwordHasher.HashPassword(
            new object(),
            dto.NewPassword
        );

        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> DeleteAccountAsync(Guid adminId)
    {
        var admin = await _context.users
            .FirstOrDefaultAsync(u => u.id == adminId && u.role == "admin");

        if (admin == null)
        {
            return false;
        }

        admin.is_active = false;

        await _context.SaveChangesAsync();

        return true;
    }
}
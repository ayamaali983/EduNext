using backend.DTOs.Auth;

namespace backend.Services.Auth;

public interface IAuthService
{
    Task<AuthResult<AuthResponseDto>> RegisterAsync(RegisterRequestDto dto);
    Task<AuthResult<AuthResponseDto>> LoginAsync(LoginRequestDto dto);
    Task<AuthResult<AuthResponseDto>> GoogleLoginAsync(GoogleLoginRequestDto dto);
}
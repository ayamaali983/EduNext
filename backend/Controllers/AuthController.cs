using backend.DTOs.Auth;
using backend.Services.Auth;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterRequestDto dto)
    {
        var result = await _authService.RegisterAsync(dto);

        if (!result.Success)
        {
            return StatusCode(result.StatusCode, new
            {
                message = result.Message,
                errors = result.Errors,
                passwordSuggestions = result.PasswordSuggestions
            });
        }

        return Ok(result.Data);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginRequestDto dto)
    {
        var result = await _authService.LoginAsync(dto);

        if (!result.Success)
        {
            return StatusCode(result.StatusCode, new
            {
                message = result.Message,
                errors = result.Errors
            });
        }

        return Ok(result.Data);
    }

    [HttpPost("google-login")]
    public async Task<ActionResult<AuthResponseDto>> GoogleLogin([FromBody] GoogleLoginRequestDto dto)
    {
        var result = await _authService.GoogleLoginAsync(dto);

        if (!result.Success)
        {
            return StatusCode(result.StatusCode, new
            {
                message = result.Message,
                errors = result.Errors
            });
        }

        return Ok(result.Data);
    }
}
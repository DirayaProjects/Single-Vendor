using EcommerceWeb.Application.Dtos;
using EcommerceWeb.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EcommerceWeb.Web.Controllers.Api.Admin;

[ApiController]
[Route("api/admin/spin-wheel")]
public class SpinWheelController : ControllerBase
{
    private readonly ISpinWheelService _service;

    public SpinWheelController(ISpinWheelService service) => _service = service;

    [HttpGet("prizes")]
    public async Task<IActionResult> GetPrizes(CancellationToken cancellationToken)
        => Ok(await _service.GetAllPrizesAsync(cancellationToken));

    [HttpPost("prizes")]
    public async Task<IActionResult> CreatePrize([FromBody] SaveSpinWheelPrizeDto dto, CancellationToken cancellationToken)
    {
        try { return Ok(await _service.CreatePrizeAsync(dto, cancellationToken)); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPut("prizes/{id:int}")]
    public async Task<IActionResult> UpdatePrize(int id, [FromBody] SaveSpinWheelPrizeDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _service.UpdatePrizeAsync(id, dto, cancellationToken);
            return result is null ? NotFound() : Ok(result);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { message = ex.Message }); }
    }

    [HttpDelete("prizes/{id:int}")]
    public async Task<IActionResult> DeletePrize(int id, CancellationToken cancellationToken)
    {
        try
        {
            return await _service.DeletePrizeAsync(id, cancellationToken) ? Ok() : NotFound();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }
}

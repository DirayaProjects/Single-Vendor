using EcommerceWeb.Application.Dtos;
using EcommerceWeb.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EcommerceWeb.Web.Controllers.Api.Admin;

[ApiController]
[Route("api/admin/promo-ads")]
public class PromoAdsController : ControllerBase
{
    private readonly IPromoAdService _service;

    public PromoAdsController(IPromoAdService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
        => Ok(await _service.GetAllAsync(cancellationToken));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SavePromoAdDto dto, CancellationToken cancellationToken)
    {
        try { return Ok(await _service.CreateAsync(dto, cancellationToken)); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] SavePromoAdDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _service.UpdateAsync(id, dto, cancellationToken);
            return result is null ? NotFound() : Ok(result);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
        => await _service.DeleteAsync(id, cancellationToken) ? Ok() : NotFound();
}

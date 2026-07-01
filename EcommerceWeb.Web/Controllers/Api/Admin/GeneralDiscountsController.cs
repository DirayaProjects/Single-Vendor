using EcommerceWeb.Application.Dtos;
using EcommerceWeb.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EcommerceWeb.Web.Controllers.Api.Admin;

[ApiController]
[Route("api/admin/general-discounts")]
public class GeneralDiscountsController : ControllerBase
{
    private readonly IGeneralDiscountService _service;

    public GeneralDiscountsController(IGeneralDiscountService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
        => Ok(await _service.GetAllAsync(cancellationToken));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SaveGeneralDiscountDto dto, CancellationToken cancellationToken)
    {
        try { return Ok(await _service.CreateAsync(dto, cancellationToken)); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] SaveGeneralDiscountDto dto, CancellationToken cancellationToken)
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

using EcommerceWeb.Application.Dtos;
using EcommerceWeb.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EcommerceWeb.Web.Controllers.Api.Admin;

[ApiController]
[Route("api/admin/[controller]")]
public class AttributesController : ControllerBase
{
    private readonly IAttributeService _attributeService;

    public AttributesController(IAttributeService attributeService)
    {
        _attributeService = attributeService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var attributes = await _attributeService.GetAllAsync(cancellationToken);
        return Ok(attributes);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var attribute = await _attributeService.GetByIdAsync(id, cancellationToken);
        return attribute is null ? NotFound() : Ok(attribute);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SaveAttributeDto dto, CancellationToken cancellationToken)
    {
        var attribute = await _attributeService.CreateAsync(dto, cancellationToken);
        return Ok(attribute);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] SaveAttributeDto dto, CancellationToken cancellationToken)
    {
        var attribute = await _attributeService.UpdateAsync(id, dto, cancellationToken);
        return attribute is null ? NotFound() : Ok(attribute);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var deleted = await _attributeService.DeleteAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }
}

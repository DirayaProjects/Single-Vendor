using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Single_Vendor.Core.Entities;
using Single_Vendor.Infrastructure.Data;
using Single_Vendor.Web.Helpers;
using Single_Vendor.Web.Models.Api;
using Single_Vendor.Web.Services;
using AttributeEntity = Single_Vendor.Core.Entities.Attribute;

namespace Single_Vendor.Web.Controllers.Api;

[ApiController]
[Route("api/admin/attributes")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
public class AdminAttributesController : ControllerBase
{
    private readonly SingleVendorDbContext _db;
    private readonly IAdminStoreAccessor _adminStore;

    public AdminAttributesController(SingleVendorDbContext db, IAdminStoreAccessor adminStore)
    {
        _db = db;
        _adminStore = adminStore;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AttributeAdminResponse>>> List(CancellationToken cancellationToken)
    {
        var storeId = await ResolveStoreIdAsync(cancellationToken);
        if (storeId is null)
            return Problem("No store linked to this admin account.", statusCode: 403);

        if (await IsAttributesModuleDisabledAsync(storeId.Value, cancellationToken))
            return Forbid();

        var list = await _db.Attributes
            .AsNoTracking()
            .Include(a => a.AttributeValues)
            .Where(a => a.StoreId == storeId.Value)
            .OrderBy(a => a.Name)
            .ToListAsync(cancellationToken);
        return Ok(list.Select(Map).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<AttributeAdminResponse>> Create(
        [FromBody] AttributeCreateRequest body,
        CancellationToken cancellationToken)
    {
        var storeId = await ResolveStoreIdAsync(cancellationToken);
        if (storeId is null)
            return Problem("No store linked to this admin account.", statusCode: 403);

        if (await IsAttributesModuleDisabledAsync(storeId.Value, cancellationToken))
            return Forbid();

        if (string.IsNullOrWhiteSpace(body.Name))
            return BadRequest("Name is required.");
        var values = NormalizeValues(body.Values);
        if (values.Count == 0)
            return BadRequest("At least one value is required.");

        var name = body.Name.Trim();
        if (await _db.Attributes.AnyAsync(a => a.StoreId == storeId.Value && a.Name == name, cancellationToken))
            return Conflict("An attribute with this name already exists.");

        var entity = new AttributeEntity
        {
            StoreId = storeId.Value,
            Name = name.Length > 200 ? name[..200] : name,
            DateAdded = DateOnly.FromDateTime(DateTime.UtcNow),
            CreatedAtUtc = DateTime.UtcNow
        };
        _db.Attributes.Add(entity);
        await _db.SaveChangesAsync(cancellationToken);

        AddValues(entity.AttributeId, values);
        await _db.SaveChangesAsync(cancellationToken);

        var created = await LoadAttribute(entity.AttributeId, cancellationToken);
        return Created($"/api/admin/attributes/{entity.AttributeId}", Map(created!));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<AttributeAdminResponse>> Update(
        int id,
        [FromBody] AttributeUpdateRequest body,
        CancellationToken cancellationToken)
    {
        var storeId = await ResolveStoreIdAsync(cancellationToken);
        if (storeId is null)
            return Problem("No store linked to this admin account.", statusCode: 403);

        if (await IsAttributesModuleDisabledAsync(storeId.Value, cancellationToken))
            return Forbid();

        if (string.IsNullOrWhiteSpace(body.Name))
            return BadRequest("Name is required.");
        var values = NormalizeValues(body.Values);
        if (values.Count == 0)
            return BadRequest("At least one value is required.");

        var entity = await _db.Attributes
            .Include(a => a.AttributeValues)
            .FirstOrDefaultAsync(a => a.AttributeId == id && a.StoreId == storeId.Value, cancellationToken);
        if (entity is null)
            return NotFound();

        var name = body.Name.Trim();
        if (name.Length > 200)
            name = name[..200];
        if (await _db.Attributes.AnyAsync(a => a.StoreId == storeId.Value && a.Name == name && a.AttributeId != id, cancellationToken))
            return Conflict("An attribute with this name already exists.");

        entity.Name = name;
        _db.AttributeValues.RemoveRange(entity.AttributeValues);
        AddValues(entity.AttributeId, values);
        await _db.SaveChangesAsync(cancellationToken);

        var updated = await LoadAttribute(id, cancellationToken);
        return Ok(Map(updated!));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var storeId = await ResolveStoreIdAsync(cancellationToken);
        if (storeId is null)
            return Problem("No store linked to this admin account.", statusCode: 403);

        if (await IsAttributesModuleDisabledAsync(storeId.Value, cancellationToken))
            return Forbid();

        var entity = await _db.Attributes
            .Include(a => a.AttributeValues)
            .FirstOrDefaultAsync(a => a.AttributeId == id && a.StoreId == storeId.Value, cancellationToken);
        if (entity is null)
            return NotFound();
        _db.AttributeValues.RemoveRange(entity.AttributeValues);
        _db.Attributes.Remove(entity);
        await _db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private async Task<bool> IsAttributesModuleDisabledAsync(int storeId, CancellationToken cancellationToken)
    {
        var f = await _db.StoreFeatureFlags.AsNoTracking()
            .FirstOrDefaultAsync(x => x.StoreId == storeId, cancellationToken);
        return !StoreFeaturePolicies.AdminAttributesEnabled(f);
    }

    private async Task<int?> ResolveStoreIdAsync(CancellationToken cancellationToken)
    {
        var uid = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue("sub");
        return await _adminStore.GetOwnedStoreIdAsync(uid, cancellationToken);
    }

    private async Task<AttributeEntity?> LoadAttribute(int id, CancellationToken cancellationToken)
    {
        var storeId = await ResolveStoreIdAsync(cancellationToken);
        if (storeId is null) return null;
        return await _db.Attributes
            .AsNoTracking()
            .Include(a => a.AttributeValues)
            .FirstOrDefaultAsync(a => a.AttributeId == id && a.StoreId == storeId.Value, cancellationToken);
    }

    private void AddValues(int attributeId, IReadOnlyList<string> values)
    {
        var order = 0;
        foreach (var v in values)
        {
            var s = v.Trim();
            if (s.Length > 500)
                s = s[..500];
            _db.AttributeValues.Add(new AttributeValue
            {
                AttributeId = attributeId,
                Value = s,
                SortOrder = order++
            });
        }
    }

    private static List<string> NormalizeValues(IReadOnlyList<string> raw)
    {
        var list = new List<string>();
        foreach (var v in raw)
        {
            if (string.IsNullOrWhiteSpace(v))
                continue;
            list.Add(v.Trim());
        }

        return list;
    }

    private static AttributeAdminResponse Map(AttributeEntity a) =>
        new()
        {
            AttributeId = a.AttributeId,
            Name = a.Name,
            DateAdded = a.DateAdded,
            Values = a.AttributeValues
                .OrderBy(v => v.SortOrder)
                .ThenBy(v => v.AttributeValueId)
                .Select(v => v.Value)
                .ToList()
        };
}

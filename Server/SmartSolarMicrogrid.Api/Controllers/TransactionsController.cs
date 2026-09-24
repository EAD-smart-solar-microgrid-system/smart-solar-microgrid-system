/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: TransactionsController.cs
 * Purpose: Controller for Grid Operator transactions.
 */
using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogrid.Api.DTOs;
using SmartSolarMicrogrid.Api.Services;
using Microsoft.AspNetCore.Authorization;

namespace SmartSolarMicrogrid.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "GridOperator")]
public class TransactionsController : ControllerBase
{
    private readonly ITransactionService _transactionService;

    public TransactionsController(ITransactionService transactionService)
    {
        _transactionService = transactionService;
    }

    [HttpPost("verify-qr")]
    public async Task<IActionResult> VerifyQr([FromBody] VerifyQrRequest request)
    {
        var result = await _transactionService.VerifyQrAsync(request);
        if (!result.Success) return BadRequest(new { message = result.Message });
        return Ok(result);
    }

    [HttpPost("{id}/complete")]
    public async Task<IActionResult> CompleteTransaction(string id)
    {
        var result = await _transactionService.CompleteTransactionAsync(id);
        if (!result.Success) return BadRequest(new { message = result.Message });
        return Ok(result);
    }
}

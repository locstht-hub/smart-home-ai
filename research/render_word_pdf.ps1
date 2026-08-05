param(
    [Parameter(Mandatory = $true)]
    [string]$SourceDocx,
    [Parameter(Mandatory = $true)]
    [string]$OutputPdf
)

$word = $null
$document = $null
try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0
    $word.Options.UpdateLinksAtOpen = $false
    $document = $word.Documents.Open($SourceDocx, $false, $true, $false)
    $pageCount = $document.ComputeStatistics(2)
    $document.ExportAsFixedFormat(
        $OutputPdf,
        17,
        $false,
        0,
        0,
        1,
        $pageCount,
        0,
        $true,
        $true,
        1,
        $true,
        $true,
        $false
    )
    [pscustomobject]@{
        Pdf = $OutputPdf
        Pages = $pageCount
        Bytes = (Get-Item -LiteralPath $OutputPdf).Length
    }
}
finally {
    if ($null -ne $document) {
        $document.Close($false)
    }
    if ($null -ne $word) {
        $word.Quit()
    }
}

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open('c:\HealthSync\HealthSync_SRS_Phase1_v1.docx')
Write-Output $doc.Content.Text
$doc.Close()
$word.Quit()

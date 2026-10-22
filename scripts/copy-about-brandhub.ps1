$pagesDir = "C:\official\src\data\pages"
$langDirs = @('ar','da','de','el','es','fi','fr','it','nl','no','pl','pt','ru','sv')

$fields = @'
brand_hub_tagline: Brand
brand_hub_title: Explore Our Brand
brand_hub_subtitle: Dive deeper into our marine engineering expertise, global presence, and the principles that drive us.

brand_hub_cards:
  - title: Marine Expertise
    desc: Decades of material science, precision manufacturing, and real-world testing — from PVC/Hypalon fabrication to deep-V hull design and drop-stitch technology.
    link: /brand-marine-expertise
    link_label: 'Learn more →'
  - title: Global Presence
    desc: Shipping to 50+ countries from our Qingdao facility with authorized service partners across Europe, Asia-Pacific, and the Americas.
    link: /brand-global-presence
    link_label: 'Learn more →'
  - title: Why Inflatable Pool Factory
    desc: Vertical integration, dual certification (ISO 9001 + BSCI), CE compliance, and low MOQs — built for brands, distributors, and government agencies.
    link: /brand-why-inflatable-pool-factory
    link_label: 'Learn more →'
'@

foreach ($lang in $langDirs) {
  $langFile = "$pagesDir\$lang\about.yaml"
  if (Test-Path $langFile) {
    $content = Get-Content $langFile -Raw
    if ($content -notmatch "^brand_hub_tagline:" -and $content -notmatch "brand_hub_cards:") {
      $content = $content.TrimEnd() + "`r`n`r`n$fields`r`n"
      Set-Content $langFile $content -NoNewline
      Write-Host "Updated: $lang\about.yaml"
    } else {
      Write-Host "Skipped (exists): $lang\about.yaml"
    }
  } else {
    Write-Host "Missing: $lang\about.yaml"
  }
}

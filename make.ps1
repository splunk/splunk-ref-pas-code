
$apps = "pas_hr_info", "pas_simulated_application_addon", 
        "pas_simulated_database_addon", "pas_simulated_files_addon",
        "pas_simulated_keycard_addon", "pas_ref_app"

function print_help() {
    Write-Output "Help"
}

function clean_artifacts() {
    Remove-Item .\out -Recurse
}

function create_packages() {
    if (-Not (Test-Path .\out\packages)) {
        New-Item -ItemType Directory -Path .\out\packages
    }
    foreach ($app in $apps) {
        slim package -o .\out\packages\ -r .\out\packages .\apps\$app
    }
}

function validate() {
    if (-Not (Test-Path -PathType Leaf .\out\packages\pas_ref_app-1.5.0.tar.gz)) {
        create_packages
    }
    slim validate .\out\packages\pas_ref_app-1.5.0.tar.gz
    
}

function partition() {
    if (-Not (Test-Path -PathType Leaf .\out\packages\pas_ref_app-1.5.0.tar.gz)) {
        create_packages
    }
    if (-Not (Test-Path .\out\partitioned)) {
        New-Item -ItemType Directory -Path .\out\partitioned
    }
    slim partition -o .\out\partitioned .\out\packages\pas_ref_app-1.5.0.tar.gz
    
}

if ($args.Length -eq 0) {
    print_help
} else {
    $command = $args.Get(0)
    switch($command) {
      "clean" {clean_artifacts}
      "package" {create_packages}
      "validate" {validate}
      "partition" {partition}
      default {print_help}
    }
}

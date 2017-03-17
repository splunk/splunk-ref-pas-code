
$dependencies = "pas_hr_info", "pas_simulated_application_addon", 
        "pas_simulated_database_addon", "pas_simulated_files_addon",
        "pas_simulated_keycard_addon"
$main_app = "pas_ref_app"

$repository_dir = ".\out\work\repository"
$standalone_build_dir = ".\out\work\standalone"
$optional_dependency_dir = ".\out\work\optional_dependencies"
$partitioned_dir = ".\out\release\partitioned"
$oneclick_dir = ".\out\release\oneclick"
$standalone_dir = ".\out\release\standalone"
$main_app_version = "1.5.2"
$main_app_archive = "$($main_app)-$($main_app_version).zip"
$oneclick_app_archive = "$($oneclick_dir)\$($main_app)-$($main_app_version).tar.gz"
$optional_splunk_dependencies = "eventgen", "splunk-add-on-google-drive", "splunk-add-on-jira-alerts"



function print_help() {
"targets:"
"  help                    Show this help message."
"  clean                   Remove artifacts"
"  validate                Validate built package (builds if not already built)"
"  package_oneclick        Package the apps for oneclick cloud install"
"  partition               Partition the PAS app"
"  standalone_package      Build package for local install"
"  package_all             Build packages for standalone, cluster (partitioned), and oneclick cloud"
"  run_in_docker           Build a docker image and run it with the app installed"
}

function clean_artifacts() {
    if (Test-Path .\out) {
        Remove-Item .\out -Recurse -Force
    }
}

function ensure_directory_exists($dirname) {
    if (-Not (Test-Path $dirname)) {
       New-Item -ItemType Directory -Path $dirname | Out-Null
    }
}

function create_oneclick_package() {
    ensure_directory_exists($repository_dir)
    ensure_directory_exists($main_app)
    foreach ($app in $dependencies) {
        slim package -o $repository_dir -r $repository_dir .\apps\$app  2>&1 | %{ "$_" }
    }
    slim package -r $repository_dir -o $oneclick_dir .\apps\$main_app 2>&1 | %{ "$_" }
}

function create_standalone_package() {
    ensure_directory_exists($standalone_build_dir)
    ensure_directory_exists($standalone_dir)
    get_optional_dependencies
    Copy-Item -Force -Recurse .\apps\$main_app $standalone_build_dir
    $addon_dir = "$standalone_build_dir\$main_app\appserver\addons"
    ensure_directory_exists($addon_dir)
    foreach ($app in $dependencies) {
        Copy-Item -Force -Recurse ./apps/$app $addon_dir
    }
    foreach ($dep in $optional_splunk_dependencies) {
        Copy-Item -Force -Recurse "$optional_dependency_dir/$dep" $addon_dir
    }
    Compress-Archive -Update -Path $standalone_build_dir\* -DestinationPath "$standalone_dir\$main_app_archive"
}

function create_all_packages() {
    create_oneclick_package
    create_standalone_package
    partition
}

function validate() {
    if (-Not (Test-Path -PathType Leaf $oneclick_app_archive)) {
        create_oneclick_package
    }
    slim validate $oneclick_app_archive 2>&1 | %{ "$_" }
}

function partition() {
    if (-Not (Test-Path -PathType Leaf $oneclick_app_archive)) {
        create_all_packages
    }
    ensure_directory_exists($partitioned_dir)
    slim partition -o $partitioned_dir $oneclick_app_archive  2>&1 | ForEach-Object { "$_" }
}

function get_optional_dependencies() {
    ensure_directory_exists($optional_dependency_dir)
    foreach ($dep in $optional_splunk_dependencies) {
        if (-Not (Test-Path "$optional_dependency_dir/$dep")) {
            git clone --depth 1 "https://github.com/splunk/$dep.git" "$optional_dependency_dir/$dep"
            Remove-Item -Recurse -Force "$optional_dependency_dir/$dep/.git"
        } else {
            "Skipping $dep"
        }
    }
}

function run_in_docker() {
    get_optional_dependencies
    "Building image"
    $image = docker build -q .
    "Starting image."
    $container = docker run --env SPLUNK_START_ARGS="--accept-license" -d -p 8000:8000 --rm $image 2>$1 | %{ "$_" }
    "Waiting for container to start"
    sleep 10
    "Launching browser"
    Start-Process http://localhost:8000
    "Launched browser."
    Read-Host "Enter to shut down Docker container"

    docker rm -f $container
}

if ($args.Length -eq 0) {
    print_help
} else {
    $command = $args.Get(0)
    switch($command) {
      "help" {print_help}
      "clean" {clean_artifacts}
      "validate" {validate}
      "package_oneclick" {create_oneclick_package}
      "partition" {partition}
      "standalone_package" {create_standalone_package}
      "package_all" {create_all_packages}
      "run_in_docker" {run_in_docker}
      default {print_help}
    }
}

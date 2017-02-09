.PHONY=help package clean
.DEFAULT=help
# apps are ordered based on dependency
DEPENDENCY_APPS=pas_hr_info pas_simulated_application_addon pas_simulated_database_addon pas_simulated_files_addon pas_simulated_keycard_addon
OPTIONAL_GIT_DEPS=eventgen splunk-add-on-google-drive splunk-add-on-jira-alerts
MAIN_APP=pas_ref_app
APPS_DIR=apps
APP_SOURCE_DIRS=$(foreach app,$(DEPENDENCY_APPS),$(APPS_DIR)/$(app))
PACKAGES_DIR=out/work/repository
STANDALONE_BUILD=out/work/standalone
PARTITIONED_DIR=out/release/partitioned
ONE_CLICK_DIR=out/release/oneclick
STANDALONE_DIR=out/release/standalone
OPTIONAL_DEPENDENCY_DIR=out/work/optional_dependencies
MAIN_APP_VERSION=1.5.2
# MAIN_APP_VERSION=$(eval grep version apps/pas_ref_app/default/app.conf | cut -d = -f 2)
MAIN_APP_PACKAGE=$(MAIN_APP)-$(MAIN_APP_VERSION).tar.gz
STANDALONE_DEP_DIR=$(STANDALONE_BUILD)/$(MAIN_APP)/appserver/addons

help: ## Show this help message.
	@echo 'usage: make [target] ...'
	@echo
	@echo 'targets:'
	@egrep '^(.+)\:\ ##\ (.+)' $(MAKEFILE_LIST) | column -t -c 2 -s ':#' | sed 's/^/  /'

clean: ## Remove artifacts
	@rm -rf out/work/optional_dependencies
	@rm -r out

$(PACKAGES_DIR):
	@mkdir -p $(PACKAGES_DIR)

$(PARTITIONED_DIR):
	@mkdir -p $(PARTITIONED_DIR)

$(ONE_CLICK_DIR):
	@mkdir -p $(ONE_CLICK_DIR)

$(STANDALONE_BUILD):
	@mkdir -p $(STANDALONE_BUILD)

$(STANDALONE_DIR):
	@mkdir -p $(STANDALONE_DIR)

validate: ## Validate built package (builds if not already built)
validate: package_oneclick
	@slim validate $(ONE_CLICK_DIR)/$(MAIN_APP_PACKAGE)

package_oneclick: ## Package the apps for oneclick cloud install
package_oneclick: $(PACKAGES_DIR) $(ONE_CLICK_DIR)
	@for i in $(APP_SOURCE_DIRS); do \
		slim package -o $(PACKAGES_DIR) -r $(PACKAGES_DIR) $$i ;\
	done
	slim package -o $(ONE_CLICK_DIR) -r $(PACKAGES_DIR) $(APPS_DIR)/$(MAIN_APP)

devlink: ## Link apps into a Splunk installation
devlink:
	@if [ -d $(SPLUNK_HOME)/etc/apps ]; then \
		for i in $(realpath $(APP_SOURCE_DIRS)); do \
			ln -s $$i $(SPLUNK_HOME)/etc/apps; \
		done \
	else \
		echo "Could not find Splunk app home at $(SPLUNK_HOME)/etc/apps"; \
		exit 1; \
	fi

partition: ## Partition the PAS app
partition: package_oneclick $(PARTITIONED_DIR)
	slim partition -o $(PARTITIONED_DIR) -r $(PACKAGES_DIR) $(ONE_CLICK_DIR)/$(MAIN_APP_PACKAGE)

standalone_package: ## Build package for local install
standalone_package: $(STANDALONE_DIR) $(STANDALONE_BUILD) optional_dependencies
	@cp -r $(APPS_DIR)/$(MAIN_APP) $(STANDALONE_BUILD)
	@mkdir -p $(STANDALONE_DEP_DIR)
	@for a in $(realpath $(APP_SOURCE_DIRS)); do \
	  cp -r $$a $(STANDALONE_DEP_DIR); \
	done
	@for dep in $(OPTIONAL_GIT_DEPS); do \
	  cp -r $(OPTIONAL_DEPENDENCY_DIR)/$$a $(STANDALONE_DEP_DIR); \
	done
	tar -cz -C $(STANDALONE_BUILD) -f ${PWD}/$(STANDALONE_DIR)/$(MAIN_APP_PACKAGE) .

package_all: ## Build packages for standalone, cluster (partitioned), and oneclick cloud
package_all: standalone_package package_oneclick partition

optional_dependencies:
	@mkdir -p $(OPTIONAL_DEPENDENCY_DIR)
	@for i in $(OPTIONAL_GIT_DEPS); do \
		if [ ! -d $(OPTIONAL_DEPENDENCY_DIR)/$$i ]; then \
			echo $$i; \
			git clone --depth 1 https://github.com/splunk/$$i.git $(OPTIONAL_DEPENDENCY_DIR)/$$i; \
			rm -rf $(OPTIONAL_DEPENDENCY_DIR)/$$i/.git; \
		fi \
	done

run_in_docker: ## Build a docker image and run it with the app installed
run_in_docker: optional_dependencies
	@echo "Building image"
	$(eval $@_IMAGE := $(shell docker build -q .))
	@echo "Starting container"
	$(eval $@_CONTAINER := $(shell docker run --env SPLUNK_START_ARGS="--accept-license" -p 8000:8000 -d --rm $($@_IMAGE)))
	$(eval $@_OS := $(shell uname))
	@echo "Launching Splunk "
	@sleep 10
	@echo "Launching browser"
	@case $($@_OS) in \
		"Darwin") open http://localhost:8000 ;; \
		*) which xdg-open > /dev/null && xdg-open http://localhost:8000 || echo "Splunk is ready at http://localhost:8000" ;; \
	esac
	@echo "Press Ctrl-C to stop and remove the container"
	@docker attach $($@_CONTAINER) || echo "Done."

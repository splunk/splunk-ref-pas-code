.PHONY=help package clean
.DEFAULT=help
# apps are ordered based on dependency
APPS=pas_hr_info pas_simulated_application_addon pas_simulated_database_addon pas_simulated_files_addon pas_simulated_keycard_addon pas_ref_app
APPS_DIR=apps
APP_SOURCE_DIRS=$(foreach app,$(APPS),$(APPS_DIR)/$(app))
PACKAGES_DIR=out/packages
PARTITIONED_DIR=out/partitioned
PAS_APP_NAME=pas_ref_app
PAS_APP_VERSION=1.5.0
PAS_PACKAGE_NAME=$(PAS_APP_NAME)-$(PAS_APP_VERSION).tar.gz

help: ## Show this help message.
	@echo 'usage: make [target] ...'
	@echo
	@echo 'targets:'
	@egrep '^(.+)\:\ ##\ (.+)' $(MAKEFILE_LIST) | column -t -c 2 -s ':#' | sed 's/^/  /'

guard-%:
ifndef ${*}
	$(error Environment variable ${*} is not set)
endif

clean: ## Remove artifacts
	@rm -r out

$(PACKAGES_DIR):
	@mkdir -p $(PACKAGES_DIR)

$(PARTITIONED_DIR):
	@mkdir -p $(PARTITIONED_DIR)

validate: ## Validate built package (builds if not already built)
validate: package
	@slim validate $(PACKAGES_DIR)/$(PAS_PACKAGE_NAME)

package: ## Package the apps
package: $(PACKAGES_DIR)
	@for i in $(APP_SOURCE_DIRS); do \
		slim package -o $(PACKAGES_DIR) -r $(PACKAGES_DIR) $$i ;\
	done

devlink: ## Link apps into a Splunk installation
devlink: guard-SPLUNK_HOME
	@if [ -d $(SPLUNK_HOME)/etc/apps ]; then \
		for i in $(realpath $(APP_SOURCE_DIRS)); do \
			ln -s $$i $(SPLUNK_HOME); \
		done \
	else \
		echo "Could not find SPLUNK_HOME/etc/apps"; \
		exit 1; \
	fi

partition: ## Partition the PAS app
partition: package $(PARTITIONED_DIR)
	slim partition -o $(PARTITIONED_DIR) $(PACKAGES_DIR)/$(PAS_PACKAGE_NAME)
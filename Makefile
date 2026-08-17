# make          install + start
# make install  deps only (submodule, pnpm, dsh CLI)
# make dsh      rebuild dsh CLI

.PHONY: all start install dsh

PNPM ?= pnpm
DSH := vendor/deepseek-harness
DSH_BIN := $(DSH)/apps/cli/lib/bin.js

export CI := true

all: start

start: install
	$(PNPM) dev

install:
	git submodule update --init
	$(PNPM) install
	@test -f $(DSH_BIN) || $(MAKE) dsh

dsh:
	$(PNPM) --dir $(DSH) install
	$(PNPM) exec tsx scripts/apply-brand.ts with-build

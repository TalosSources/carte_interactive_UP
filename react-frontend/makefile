compile_ts:
	npx tsc

TS_FILES := $(shell fd -t f \.ts$$ | sed -e 's/ts$$/js/')
TSX_FILES := $(shell fd -t f \.tsx$$ | sed -e 's/tsx$$/js/')
GITREF := $(shell git describe --long --all --dirty)

remove_generate_js:
	rm ${TS_FILES}
	rm ${TSX_FILES}

version:
	echo 'export const version = "${GITREF}"' > src/version.tsx
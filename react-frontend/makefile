compile_ts:
	npx tsc

TS_FILES := $(shell fd -t f \.ts$$ | sed -e 's/ts$$/js/')
TSX_FILES := $(shell fd -t f \.tsx$$ | sed -e 's/tsx$$/js/')

remove_generate_js:
	rm ${TS_FILES}
	rm ${TSX_FILES}

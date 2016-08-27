freemat.js: freemat.pegjs
	pegjs freemat.pegjs

.PHONY: debug
debug:
	pegjs --trace freemat.pegjs

.PHONY: test
test: freemat.js
	NODE_PATH=/usr/local/lib/node_modules/ mocha

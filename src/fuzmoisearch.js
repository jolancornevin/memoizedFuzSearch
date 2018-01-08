import fuzzysort from 'fuzzysort';

const ENABLED = 'ENABLED';
/**
 * A small helper class that fuzzy search a string into a list of strings.
 * It uses a cache to avoid doing to many searchs
 */
export default class FuzzySearch {
    constructor(list = [], options = {}) {
        // TODO prepare
        this.list = list;
        this.options = options;
        this.options.threshold = options.threshold || -Infinity;
        this.cache = new Map();
    }

    /**
     * This method is formating the results of the query to remove all meta data of the fuzzy library
     *
     * We need to keep the original results for the add and remove methods, to sort results
     * @param results
     * @returns {Object}
     * @private
     */
    static _formatResult(results = []) {
        return {
            'fuzzy': results,
            'results': results.map(result => result['target'] || '')
        };
    }

    /**
     * Call this method to do a query on the list and look for matching strings
     * @param query
     * @returns [string]
     */
    search(query = '') {
        const cachedRes = this.cache.get(query);
        if (cachedRes)
            return cachedRes.results;

        const result = FuzzySearch._formatResult(
            fuzzysort.go(query, this.list, this.options)
        );

        this.cache.set(query, result);

        return result.results;
    }

    reset () {
        this.cache = new Map();
    }

    /**
     * Add the new target to the list and also re-compute all related indexes
     *
     * @param target
     */
    add(target) {
        // TODO prepare
        this.list.push(target);

        this._iterateTroughCached(target, (indexToInsert, result, cachedValue) => {
            // Insert the new target in the cached results
            cachedValue.fuzzy.splice(indexToInsert, 0, result);
            cachedValue.results.splice(indexToInsert, 0, target);
        });
    }

    /**
     * Remove the target from the list and re-compute all related indexes
     * @param target
     */
    remove(target) {
        let targetIndex = this.list.indexOf(target);
        if (targetIndex == -1)
            return;

        this.list.splice(targetIndex, 1);

        this._iterateTroughCached(target, (indexToDelete, _, cachedValue) => {
            // Delete the target in the cached results
            cachedValue.fuzzy.splice(indexToDelete, 1);
            cachedValue.results.splice(indexToDelete, 1);
        });
    }

    /**
     * A generic method that iterate over the cached results and call the cb function when it find a place that match
     * @param target
     * @param cb
     * @private
     */
    _iterateTroughCached(target, cb) {
        this.cache.forEach((cachedValue, cachedQuery) => {
            // Find if the cached query can be found in the new target
            let fuzzyResult = fuzzysort.single(cachedQuery, target),
                indexFuzzy = 0,
                fuzzyLen = cachedValue.fuzzy.length;

            // fuzzysort returns null if it doesn't find anything
            if (fuzzyResult && fuzzyResult.score > this.options.threshold) {
                // Iterate in our cached results until we find a target that have a worst score than the new target
                while (indexFuzzy < fuzzyLen && fuzzyResult.score < cachedValue.fuzzy[indexFuzzy].score) {
                    // Do this here and not in the while statement to avoid having to decrease it at the end
                    indexFuzzy++;
                }

                cb(indexFuzzy, fuzzyResult, cachedValue);
            }
        });
    }
}

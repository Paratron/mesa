<?php
/**
 * Nullcache
 * =========
 * Implements a Key/Value Storage interface, but doesn't cache anything. Switch to this for debugging tasks.
 *
 * @author: Christian Engel <hello@wearekiss.com> 
 * @version: 1 16.11.14
 */

namespace Kiss\KVWrappers;

class Nullcache extends \Kiss\KeyValueWrapper{
    function get($key){
        return NULL;
    }

    function set($key, $value){}

    function remove($key){}
}
 
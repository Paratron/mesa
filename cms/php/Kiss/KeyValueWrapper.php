<?php
/**
 * KeyValueWrapper
 * ===============
 * KeyValueWrappers must implement the following methods to deliver a universal access despite the actual scoring method.
 *
 * @author: Christian Engel <hello@wearekiss.com> 
 * @version: 1 01.03.14
 */

namespace Kiss;

abstract class KeyValueWrapper {
    /**
     * The get method takes a string key and returns either a string
     * or an array (if an object has been stored).
     *
     * @param {string} $key
     * @return string|array|null Returns NULL, if the value isn't defined.
     */
    abstract function get($key);

    /**
     * The set method takes a string key to store the given value under
     * and a value of type integer, string, array or object.
     * If the value has not been stored before, it will be created. If
     * the value has been stored before, it will be overwritten.
     *
     * @param {string} $key
     * @param {mixed} $value
     * @return {boolean}
     */
    abstract function set($key, $value);

    /**
     * Removes a value from the pool, if it exists.
     * @param {string} $key
     * @return void
     */
    abstract function remove($key);
}
 
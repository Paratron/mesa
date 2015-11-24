<?
/**
 * Node Object
 * ===========
 * Nodes are information objects in the CMS. They represent classic "pages" of a website, as well as folders.
 * Apply a struct on a node to enable it to gather data through custom-build forms in the backend and apply a
 * template to it to enable it to render and send the information to the user.
 *
 * @author: Christian Engel <hello@wearekiss.com>
 * @version 1 22.10.2015
 */

namespace CMS\Objects;


class Node
{
	/**
	 * Id of the object in database.
	 * @var {Integer}
	 */
	var $id;

	/**
	 * Reference to the Database object.
	 * @var {\Kiss\MySQLi}
	 */
	var $db;

	/**
	 * Database sync state
	 * @var {Boolean}
	 */
	var $dbSync;

	/**
	 * Id of the child which should be used as the default page to show if this node is a folder.
	 * @var integer
	 */
	var $groupIndex;

	/**
	 * URL fragment that identifies this node within its hierarchy - must be unique combined with parentId.
	 * @var string
	 */
	var $urlFragment;

	/**
	 * Id of the next higher node which "contains" this node.
	 * Is zero at the root level.
	 * @var integer
	 */
	var $parentId;

	/**
	 * Two characters language key of this node.
	 * Leave empty, if you don't plan to use multi-language support in your website.
	 * @var string
	 */
	var $langKey;

	/**
	 * A identifier that connects pages across different languages and helps switching the frontend language
	 * of the page while staying on the logically same page.
	 * @var string
	 */
	var $langLink;

	/**
	 * The name of this node. Will be displayed inside the CMS backend and can be used as the page title
	 * in the frontend as well - depends on the template.
	 * @var string
	 */
	var $title;

	/**
	 * Array with configuration properties.
	 * @var array
	 */
	var $config;

	/**
	 * Array with content data. Can be anything and depends on the used struct file.
	 * @var array
	 */
	var $content;

	/**
	 * UNIX timestamp of when this node has been created.
	 * @var integer
	 */
	var $creationTime;

	/**
	 * Id of the user who has created this node.
	 * @var integer
	 */
	var $creatorId;

	/**
	 * UNIX timestamp of when this node has been edited the last time.
	 * @var integer
	 */
	var $modificationTime;

	/**
	 * Id of the user who has edited this node the last time.
	 * @var integer
	 */
	var $modificatorId;

	/**
	 * Key of the struct file to be used for this node. It defines the custom input form in the CMS backend.
	 * @var string
	 */
	var $structKey;

	/**
	 * Key of the template file to be used for this node. The nodes' content data will be rendered with this template.
	 * @var string
	 */
	var $templateKey;

	/**
	 * Name of the related table in the database.
	 * @var string
	 */
	static $dbTable = 'nodes';

	function __construct(/* polymorph */)
	{
		global $db;
		$this->db = $db;

		if (func_num_args() === 1) {
			$arg0 = func_get_arg(0);

			if (is_array($arg0)) {
				$this->assignVars($arg0);
				if ($this->id) {
					$this->dbSync = TRUE;
				}
			}

			if (is_integer($arg0)) {
				$sql = 'SELECT * FROM ' . self::$dbTable . ' WHERE id = ' . intval($arg0) . ';';

				$result = $this->db->queryRow($sql);
				if (!$result) {
					throw new \ErrorException('Object not found in database');
				}
				$this->assignVars($result);
				$this->dbSync = TRUE;
			}

			return;
		}

		$this->creationTime = time();
	}

	/**
	 * Takes an array and assigns the properties to this object instance.
	 * @param {Array} $a
	 */
	private function assignVars($a)
	{
		$this->id = (int)$a['id'];
		$this->groupIndex = (int)$a['groupIndex'];
		$this->urlFragment = $a['urlFragment'];
		$this->parentId = (int)$a['parentId'];
		$this->langKey = $a['langKey'];
		$this->title = $a['title'];
		$this->config = json_decode($a['config'], TRUE);
		$this->content = json_decode($a['content'], TRUE);
		$this->creationTime = (int)$a['creationTime'];
		$this->creatorId = (int)$a['creatorId'];
		$this->modificationTime = (int)$a['modificationTime'];
		$this->modificatorId = (int)$a['modificatorId'];
		$this->structKey = $a['structKey'];
		$this->templateKey = $a['templateKey'];
	}

	//-----------------------------------------------------------------------------------------------------


	/**
	 * Returns a Array representation of the object to be - for instance - be returned as a JSON object.
	 * @return array
	 */
	function getJSON()
	{
		return array(
			'id' => $this->id,
			'groupIndex' => $this->groupIndex,
			'urlFragment' => $this->urlFragment,
			'parentId' => $this->parentId,
			'langKey' => $this->langKey,
			'title' => $this->title,
			'config' => $this->config,
			'content' => $this->content,
			'creationTime' => $this->creationTime,
			'creatorId' => $this->creatorId,
			'modificationTime' => $this->modificationTime,
			'modificatorId' => $this->modificatorId,
			'structKey' => $this->structKey,
			'templateKey' => $this->templateKey
		);
	}

	/**
	 * Will write the objects information to the database.
	 * If the object doesn't exist in the database, it will be created and the returned Id will be set as $id property.
	 * Saving the object will set the $dbSync status to TRUE.
	 * @throws \ErrorException
	 */
	function save()
	{
		$this->modificationTime = time();

		$put = $this->getJSON();
		unset($put['id']);

		$put['config'] = json_encode($put['config']);
		$put['content'] = json_encode($put['content']);

		if ($this->id) {
			$sql = 'UPDATE ' . self::$dbTable . ' SET ' . $this->db->makeSqlSetString($put) . ' WHERE id = ' . $this->id . ';';
			$this->db->query($sql);
		} else {
			$sql = 'INSERT INTO ' . self::$dbTable . $this->db->makeSqlValueString($put);
			$this->id = $this->db->queryInsert($sql);
		}

		$this->dbSync = TRUE;
	}

	function updateContent($key, $value)
	{
		$key = explode('.', $key);
		if (!$this->content) {
			$this->content = array();
		}

		$this->content = $this->recursiveUpdate($this->content, $key, $value);
	}

	private function recursiveUpdate($object, $key,  $value)
	{
		$index = -1;
		$currentKey = array_shift($key);

		if(preg_match('|^(.+?)\[(\d+)\]$|', $currentKey, $matches)){
			$currentKey = $matches[1];
			$index = (int)$matches[2];
		}

		if (isset($object[$currentKey])) {
			$currentObject = $object[$currentKey];
		}

		if (count($key)) { //Need to go deeper?
			$object[$currentKey] = $this->recursiveUpdate(isset($currentObject) ? $currentObject : array(), $key, $value);
			return $object;
		}

		if ($index == -1 && $value == -8646543) {
			if (isset($object[$currentKey])) {
				unset($object[$currentKey]);
			}
			return $object;
		}

		if ($index > -1 && $value == -8646543) {
			if (isset($currentObject[0])) { //Test for numeric array
				array_splice($currentObject, $index, 1);
			}
			$object[$currentKey] = $currentObject;
			return $object;
		}

		if($index == -1){
			$currentObject = $value;
			$object[$currentKey] = $currentObject;
			return $object;
		}

		if(!isset($currentObject)){
			$currentObject = NULL;
		}

		if(!is_array($currentObject)){
			$currentObject = array($currentObject);
		}

		//Fill the array, if it has missing indexes in between.
		if(count($currentObject) < $index){
			for($i = count($currentObject); $i < $index; $i++){
				$currentObject[] = NULL;
			}
		}

		$currentObject[$index] = $value;

		$object[$currentKey] = $currentObject;
		return $object;
	}

	/**
	 * Fetches all nodes on the root and second level of the website to be able to quickly render the page tree on the left
	 * side of the CMS backend.
	 * @return array
	 */
	public static function getPayload()
	{
		global $db;

		$result = $db->queryAll('SELECT id, title, parentId, structKey, urlFragment FROM ' . self::$dbTable . ' WHERE parentId = 0 OR parentId IN(SELECT id FROM ' . self::$dbTable . ' WHERE parentId = 0);');

		return $result;
	}

	/**
	 * Checks, if the Node with the given identifier exists.
	 * You can pass either only a node id (numeric), or pass a urlFragment and a parent node id (numeric).
	 * @param $identifier
	 * @param [$parentNode=NULL]
	 * @return bool
	 */
	public static function exists($identifier, $parentNode = NULL)
	{
		global $db;

		if ($parentNode) {
			$sql = 'SELECT id FROM ' . self::$dbTable . ' WHERE urlFragment = ' . $db->escape($identifier) . ' AND parentId = ' . (int)$parentNode . ';';
		} else {
			$sql = 'SELECT id FROM ' . self::$dbTable . ' WHERE id = ' . (int)$identifier . ';';
		}

		$result = $db->queryValue($sql);

		if ($result) {
			return TRUE;
		}
		return FALSE;
	}
}
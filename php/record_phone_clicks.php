<?php
    require_once('../classes/click.php');
    require_once('../classes/clone_classes.php');
    require_once('../classes/badTripClasses.php');

    $click = new Click;
    //convert requests to variables
    $clickable_id = (isset($_REQUEST['clickable_id'])) ? $_REQUEST['clickable_id'] : null;
    $clickable_type = (isset($_REQUEST['clickable_type'])) ? $_REQUEST['clickable_type'] : null;
    $visitor_id = null;
    $category_id = (isset($_REQUEST['catID'])) ? $_REQUEST['catID'] : 103;
    $clone_id = (isset($_REQUEST['cloneID'])) ? $_REQUEST['cloneID'] : null;
    $click_source_id = (isset($_REQUEST['clickSourceID'])) ? $_REQUEST['clickSourceID'] : null;
    $link_type_id = (isset($_REQUEST['linkTypeID'])) ? $_REQUEST['linkTypeID'] : null;
    $clone_tab_id = null;
    $group_id = (isset($_REQUEST['group_id'])) ? $_REQUEST['group_id'] : null;
    $created_at = date('Y-m-d H:i:s');

    $click_params = array(
        "clickable_id" => $clickable_id,
        "clickable_type" => $clickable_type,
        "visitor_id" => $visitor_id,
        "category_id" => $category_id,
        "clone_id" => $clone_id,
        "click_source_id" => $click_source_id,
        "link_type_id" => $link_type_id,
        "clone_tab_id" => $clone_tab_id,
        "group_id" => $group_id,
        "created_at" => $created_at
    );

    if(!valid_params($click_params)) {
        $response = array(
            'status' => 'failed',
            'params' => $click_params
        );
        header('Content-type: text/json');
        echo json_encode($response);
        exit;
    }


    $click_id = $click->save($click_params);
    $response = array(
        'status' => ($click_id) ? 'success' : 'failed',
        'insert_id' => $click_id
    );
    header('Content-type: text/json');
    echo json_encode($response);
    exit;
?>

<?php

function valid_params($params) {
    if(!isset($params['clickable_id'])    || !$params['clickable_id'] ||
       !isset($params['clickable_type'])  || !$params['clickable_type'] ||
       !isset($params['link_type_id'])    || !$params['link_type_id'] ||
       !isset($params['click_source_id']) || !$params['click_source_id'] ||
       !isset($params['clone_id'])        || !$params['clone_id'] ||
       !isset($params['group_id'])        || !$params['group_id'] ||
       !isset($params['category_id'])     || !$params['category_id']) {
        return false;
    }
    return true;
}

?>

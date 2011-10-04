
<?php

/**
 * @file
 * Based off of Bartik's page.tpl.php.  This is used to create a super simple node template
 * to render a node in a way that works in lightboxes.  Most crap like header, footer, side menue are gone.
 * By Tyson.  Can be invoked by linking to a node with ?format=simple in the url.  Example node/xxx/?format=simple
 */

?>
<div id="page-wrapper"><div id="page">
  <div id="main-wrapper" class="clearfix"><div id="main" class="clearfix">
    <div id="content" class="column"><div class="section">
      <a id="main-content"></a>
      <?php if ($title): ?>
        <h1 class="title" id="page-title">
          <?php print $title; ?>
        </h1>
      <?php endif; ?>
      <?php print render($title_suffix); ?>
      <?php print render($page['content']); ?>
    </div></div> <!-- /.section, /#content -->
  </div></div> <!-- /#main, /#main-wrapper -->
  </div></div>
